import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { extractStoragePath, getPackagePricingDetails, resolveDestinationName, slugify } from "@/lib/cms";
import { ExternalLink, Pencil, Plus, Trash2, Upload, X } from "lucide-react";

type Package = Database["public"]["Tables"]["packages"]["Row"];
type PackageMedia = Database["public"]["Tables"]["package_media"]["Row"];
type Destination = Database["public"]["Tables"]["destinations"]["Row"];

type PackageListItem = Package & {
  destination_record: Destination | null;
};

const emptyPackage = {
  title: "",
  slug: "",
  destinationId: "",
  discountedPrice: 0,
  actualPrice: 0,
  duration: "",
  description: "",
  short_description: "",
  highlights: [] as string[],
  itinerary: [] as { day: number; title: string; description: string }[],
  inclusions: [] as string[],
  exclusions: [] as string[],
  featured: false,
};

export default function AdminPackages() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [editing, setEditing] = useState<PackageListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyPackage);
  const [media, setMedia] = useState<PackageMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [highlightInput, setHighlightInput] = useState("");
  const [inclusionInput, setInclusionInput] = useState("");
  const [exclusionInput, setExclusionInput] = useState("");
  const [itineraryInput, setItineraryInput] = useState({ title: "", description: "" });

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("packages")
      .select("*, destination_record:destinations!packages_destination_id_fkey(*)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load packages", description: error.message, variant: "destructive" });
      setPackages([]);
    } else {
      setPackages((data as PackageListItem[]) || []);
    }
    setLoading(false);
  }, [toast]);

  const fetchDestinations = useCallback(async () => {
    const { data, error } = await supabase
      .from("destinations")
      .select("*")
      .order("sort_order")
      .order("name");

    if (error) {
      toast({ title: "Failed to load destinations", description: error.message, variant: "destructive" });
      setDestinations([]);
      return;
    }

    setDestinations(data || []);
    setForm((current) => {
      if (current.destinationId || !(data && data.length)) return current;
      return { ...current, destinationId: data[0].id };
    });
  }, [toast]);

  const fetchMedia = async (packageId: string) => {
    const { data, error } = await supabase
      .from("package_media")
      .select("*")
      .eq("package_id", packageId)
      .order("sort_order");

    if (error) {
      toast({ title: "Failed to load package media", description: error.message, variant: "destructive" });
      setMedia([]);
      return;
    }

    setMedia(data || []);
  };

  useEffect(() => {
    void Promise.all([fetchPackages(), fetchDestinations()]);
  }, [fetchDestinations, fetchPackages]);

  const resetEditorState = () => {
    setHighlightInput("");
    setInclusionInput("");
    setExclusionInput("");
    setItineraryInput({ title: "", description: "" });
    setMedia([]);
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setSaving(false);
    resetEditorState();
    setForm({
      ...emptyPackage,
      destinationId: destinations[0]?.id || "",
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    resetEditorState();
    setForm({
      ...emptyPackage,
      destinationId: destinations[0]?.id || "",
    });
  };

  const startEdit = (pkg: PackageListItem) => {
    setEditing(pkg);
    setCreating(false);
    setForm({
      title: pkg.title,
      slug: pkg.slug,
      destinationId: pkg.destination_id || destinations.find((destination) => destination.name === pkg.destination)?.id || "",
      discountedPrice: pkg.price,
      actualPrice: pkg.actual_price,
      duration: pkg.duration,
      description: pkg.description,
      short_description: pkg.short_description,
      highlights: pkg.highlights || [],
      itinerary: (pkg.itinerary as { day: number; title: string; description: string }[]) || [],
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      featured: pkg.featured || false,
    });
    resetEditorState();
    void fetchMedia(pkg.id);
  };

  const handleSave = async () => {
    const nextSlug = slugify(form.slug || form.title);
    const selectedDestination = destinations.find((destination) => destination.id === form.destinationId);

    if (!form.title.trim() || !selectedDestination || !form.discountedPrice || !form.actualPrice || !form.duration.trim() || !nextSlug) {
      toast({ title: "Please complete the required fields", variant: "destructive" });
      return;
    }

    if (form.discountedPrice > form.actualPrice) {
      toast({ title: "Discounted price cannot be more than actual price", variant: "destructive" });
      return;
    }

    setSaving(true);

    const payload = {
      slug: nextSlug,
      title: form.title.trim(),
      destination_id: selectedDestination.id,
      destination: selectedDestination.name,
      price: form.discountedPrice,
      actual_price: form.actualPrice,
      duration: form.duration.trim(),
      description: form.description.trim(),
      short_description: form.short_description.trim(),
      highlights: form.highlights,
      itinerary: form.itinerary as unknown as Database["public"]["Tables"]["packages"]["Insert"]["itinerary"],
      inclusions: form.inclusions,
      exclusions: form.exclusions,
      featured: form.featured,
    };

    if (creating) {
      const { data, error } = await supabase.from("packages").insert(payload).select("*, destination_record:destinations!packages_destination_id_fkey(*)").single();
      setSaving(false);

      if (error) {
        toast({ title: "Failed to create package", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Package created. You can upload images and videos now." });
      setCreating(false);
      setEditing(data as PackageListItem);
      void Promise.all([fetchPackages(), fetchMedia(data.id)]);
      return;
    }

    if (!editing) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("packages").update(payload).eq("id", editing.id);
    setSaving(false);

    if (error) {
      toast({ title: "Failed to update package", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Package updated" });
    void fetchPackages();
  };

  const handleDelete = async (pkg: PackageListItem) => {
    if (!confirm(`Delete ${pkg.title} and all its media?`)) return;

    const { data: mediaFiles } = await supabase.from("package_media").select("url").eq("package_id", pkg.id);
    const paths = (mediaFiles || [])
      .map((item) => extractStoragePath(item.url, "package-media"))
      .filter(Boolean);

    if (paths.length) {
      await supabase.storage.from("package-media").remove(paths);
    }

    const { error } = await supabase.from("packages").delete().eq("id", pkg.id);
    if (error) {
      toast({ title: "Failed to delete package", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Package deleted" });
    if (editing?.id === pkg.id) {
      cancel();
    }
    void fetchPackages();
  };

  const handleUploadMedia = async (event: ChangeEvent<HTMLInputElement>, packageId: string) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);

    for (const [index, file] of Array.from(files).entries()) {
      const extension = file.name.split(".").pop();
      const path = `${packageId}/${Date.now()}-${index}.${extension}`;
      const type = file.type.startsWith("video") ? "video" : "image";

      const { error: uploadError } = await supabase.storage.from("package-media").upload(path, file);
      if (uploadError) {
        toast({ title: "Media upload failed", description: uploadError.message, variant: "destructive" });
        continue;
      }

      const { data } = supabase.storage.from("package-media").getPublicUrl(path);
      const { error: insertError } = await supabase.from("package_media").insert({
        package_id: packageId,
        type,
        url: data.publicUrl,
        sort_order: media.length + index,
      });

      if (insertError) {
        toast({ title: "Media upload failed", description: insertError.message, variant: "destructive" });
      }
    }

    await fetchMedia(packageId);
    setUploading(false);
    event.target.value = "";
    toast({ title: "Media uploaded" });
  };

  const handleDeleteMedia = async (item: PackageMedia) => {
    const path = extractStoragePath(item.url, "package-media");
    if (path) {
      await supabase.storage.from("package-media").remove([path]);
    }

    const { error } = await supabase.from("package_media").delete().eq("id", item.id);
    if (error) {
      toast({ title: "Failed to delete media", description: error.message, variant: "destructive" });
      return;
    }

    setMedia((current) => current.filter((entry) => entry.id !== item.id));
    toast({ title: "Media deleted" });
  };

  const addArrayItem = (field: "highlights" | "inclusions" | "exclusions", value: string, reset: (value: string) => void) => {
    if (!value.trim()) return;
    setForm((current) => ({ ...current, [field]: [...current[field], value.trim()] }));
    reset("");
  };

  const removeArrayItem = (field: "highlights" | "inclusions" | "exclusions", index: number) => {
    setForm((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }));
  };

  const addItineraryDay = () => {
    if (!itineraryInput.title.trim()) return;
    setForm((current) => ({
      ...current,
      itinerary: [
        ...current.itinerary,
        {
          day: current.itinerary.length + 1,
          title: itineraryInput.title.trim(),
          description: itineraryInput.description.trim(),
        },
      ],
    }));
    setItineraryInput({ title: "", description: "" });
  };

  const removeItineraryDay = (index: number) => {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, day: itemIndex + 1 })),
    }));
  };

  const isEditorOpen = creating || !!editing;
  const selectedDestination = destinations.find((destination) => destination.id === form.destinationId) || null;
  const previewSlug = slugify(form.slug || form.title);
  const previewImage = media.find((item) => item.type === "image")?.url || selectedDestination?.card_image_url || selectedDestination?.hero_image_url || "/placeholder.svg";
  const pricing = getPackagePricingDetails(form.discountedPrice, form.actualPrice);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Packages</h1>
          <p className="text-sm text-muted-foreground mt-1">Create itinerary-driven travel packages and connect them to live destinations.</p>
        </div>
        {!isEditorOpen && (
          <Button onClick={startCreate} size="sm" disabled={destinations.length === 0}>
            <Plus className="mr-1 h-4 w-4" />
            Add Package
          </Button>
        )}
      </div>

      {destinations.length === 0 && !isEditorOpen && (
        <div className="mb-6 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Add at least one destination before creating packages.
        </div>
      )}

      {isEditorOpen ? (
        <div className="bg-card rounded-xl p-6 shadow-elegant space-y-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold">{creating ? "New Package" : "Edit Package"}</h2>
              <p className="text-sm text-muted-foreground mt-1">Use destination links instead of plain text so the package stays connected if the place name changes later.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Package Title *"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                />
                <Input
                  placeholder="Slug"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                />
                <Select value={form.destinationId} onValueChange={(value) => setForm((current) => ({ ...current, destinationId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((destination) => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {destination.name}{destination.published ? "" : " (Draft)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Duration *"
                  value={form.duration}
                  onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
                />
                <Input
                  placeholder="Discounted Price *"
                  type="number"
                  value={form.discountedPrice || ""}
                  onChange={(event) => setForm((current) => ({ ...current, discountedPrice: Number(event.target.value) }))}
                />
                <Input
                  placeholder="Actual Price *"
                  type="number"
                  value={form.actualPrice || ""}
                  onChange={(event) => setForm((current) => ({ ...current, actualPrice: Number(event.target.value) }))}
                />
              </div>

              <Input
                placeholder="Short Description"
                value={form.short_description}
                onChange={(event) => setForm((current) => ({ ...current, short_description: event.target.value }))}
              />
              <Textarea
                placeholder="Full Description"
                rows={5}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />

              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <Switch checked={form.featured} onCheckedChange={(value) => setForm((current) => ({ ...current, featured: value }))} />
                <div>
                  <p className="text-sm font-medium text-foreground">Featured Package</p>
                  <p className="text-xs text-muted-foreground">Featured packages appear in the homepage showcase.</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Highlights</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add highlight"
                    value={highlightInput}
                    onChange={(event) => setHighlightInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addArrayItem("highlights", highlightInput, setHighlightInput))}
                  />
                  <Button variant="outline" size="sm" onClick={() => addArrayItem("highlights", highlightInput, setHighlightInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.highlights.map((item, index) => (
                    <span key={`${item}-${index}`} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {item}
                      <button type="button" onClick={() => removeArrayItem("highlights", index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Itinerary</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <Input
                    placeholder="Day title"
                    value={itineraryInput.title}
                    onChange={(event) => setItineraryInput((current) => ({ ...current, title: event.target.value }))}
                    className="flex-1 min-w-[180px]"
                  />
                  <Input
                    placeholder="Description"
                    value={itineraryInput.description}
                    onChange={(event) => setItineraryInput((current) => ({ ...current, description: event.target.value }))}
                    className="flex-[2] min-w-[220px]"
                  />
                  <Button variant="outline" size="sm" onClick={addItineraryDay}>Add Day</Button>
                </div>
                <div className="space-y-2">
                  {form.itinerary.map((item, index) => (
                    <div key={`${item.day}-${index}`} className="flex items-start gap-3 bg-muted p-3 rounded-lg text-sm">
                      <span className="font-bold text-primary shrink-0">Day {item.day}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{item.description}</p>
                      </div>
                      <button type="button" onClick={() => removeItineraryDay(index)}>
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Inclusions</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add inclusion"
                    value={inclusionInput}
                    onChange={(event) => setInclusionInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addArrayItem("inclusions", inclusionInput, setInclusionInput))}
                  />
                  <Button variant="outline" size="sm" onClick={() => addArrayItem("inclusions", inclusionInput, setInclusionInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.inclusions.map((item, index) => (
                    <span key={`${item}-${index}`} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {item}
                      <button type="button" onClick={() => removeArrayItem("inclusions", index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Exclusions</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add exclusion"
                    value={exclusionInput}
                    onChange={(event) => setExclusionInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addArrayItem("exclusions", exclusionInput, setExclusionInput))}
                  />
                  <Button variant="outline" size="sm" onClick={() => addArrayItem("exclusions", exclusionInput, setExclusionInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.exclusions.map((item, index) => (
                    <span key={`${item}-${index}`} className="inline-flex items-center gap-1 bg-destructive/10 text-destructive text-xs px-2 py-1 rounded-full">
                      {item}
                      <button type="button" onClick={() => removeArrayItem("exclusions", index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {editing && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Images and Videos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {media.map((item) => (
                      <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                        {item.type === "image" ? (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={item.url} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Upload className="h-5 w-5 mx-auto mb-1" />
                      {uploading ? "Uploading..." : "Upload package images or videos"}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                      multiple
                      onChange={(event) => handleUploadMedia(event, editing.id)}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border overflow-hidden bg-muted">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={previewImage} alt={form.title || "Package preview"} className="h-full w-full object-cover" />
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
                  <p className="text-lg font-display font-semibold text-foreground">{form.title || "Package title"}</p>
                  <p className="text-sm text-muted-foreground">{selectedDestination?.name || "Select a destination"} - {form.duration || "Duration"}</p>
                  {pricing.discountedPrice ? (
                    <div className="space-y-1">
                      <p className="text-sm text-primary font-semibold">Rs. {pricing.discountedPrice.toLocaleString("en-IN")}</p>
                      {pricing.hasDiscount && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted-foreground line-through">Rs. {pricing.actualPrice.toLocaleString("en-IN")}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">{pricing.discountPercent}% OFF</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-primary font-semibold">Add package pricing</p>
                  )}
                  <p className="text-xs text-muted-foreground">URL: /packages/{previewSlug || "package-slug"}</p>
                  {previewSlug && (
                    <a
                      href={`/packages/${previewSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Open package page
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : creating ? "Create Package" : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={cancel}>Back to List</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : packages.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No packages yet.</p>
          ) : (
            packages.map((pkg) => {
              const itemPricing = getPackagePricingDetails(pkg.price, pkg.actual_price);

              return (
                <div key={pkg.id} className="bg-card rounded-xl p-4 shadow-elegant flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground">{pkg.title}</h3>
                      {pkg.featured && (
                        <span className="text-[10px] font-bold uppercase bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Featured</span>
                      )}
                      {itemPricing.hasDiscount && (
                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {itemPricing.discountPercent}% Off
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {resolveDestinationName(pkg.destination_record, pkg.destination)} - {pkg.duration}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-primary">Rs. {itemPricing.discountedPrice.toLocaleString("en-IN")}</span>
                      {itemPricing.hasDiscount && (
                        <span className="text-muted-foreground line-through">Rs. {itemPricing.actualPrice.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">/{pkg.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(pkg)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(pkg)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </AdminLayout>
  );
}
