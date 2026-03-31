import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/cms";
import { ExternalLink, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";

type Destination = Database["public"]["Tables"]["destinations"]["Row"];
type Package = Database["public"]["Tables"]["packages"]["Row"];
type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];

interface DestinationStats {
  packages: number;
  posts: number;
}

const emptyDestination = {
  name: "",
  slug: "",
  tagline: "",
  short_description: "",
  description: "",
  hero_image_url: "",
  hero_video_url: "",
  card_image_url: "",
  published: true,
  sort_order: 0,
};

export default function AdminDestinations() {
  const { toast } = useToast();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationStats, setDestinationStats] = useState<Record<string, DestinationStats>>({});
  const [editing, setEditing] = useState<Destination | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyDestination);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);

    const [{ data: destinationRows, error: destinationError }, { data: packageRows }, { data: blogRows }] = await Promise.all([
      supabase.from("destinations").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("packages").select("id, destination_id, destination"),
      supabase.from("blog_posts").select("id, destination_id, destination"),
    ]);

    if (destinationError) {
      toast({ title: "Failed to load destinations", description: destinationError.message, variant: "destructive" });
      setDestinations([]);
      setDestinationStats({});
      setLoading(false);
      return;
    }

    const nextDestinations = destinationRows || [];
    const stats = nextDestinations.reduce<Record<string, DestinationStats>>((accumulator, destination) => {
      accumulator[destination.id] = {
        packages: (packageRows || []).filter((pkg: Pick<Package, "destination" | "destination_id">) => pkg.destination_id === destination.id || pkg.destination === destination.name).length,
        posts: (blogRows || []).filter((post: Pick<BlogPost, "destination" | "destination_id">) => post.destination_id === destination.id || post.destination === destination.name).length,
      };
      return accumulator;
    }, {});

    setDestinations(nextDestinations);
    setDestinationStats(stats);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void fetchDestinations();
  }, [fetchDestinations]);

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setSaving(false);
    setForm(emptyDestination);
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      ...emptyDestination,
      sort_order: destinations.length + 1,
    });
  };

  const startEdit = (destination: Destination) => {
    setEditing(destination);
    setCreating(false);
    setForm({
      name: destination.name,
      slug: destination.slug,
      tagline: destination.tagline,
      short_description: destination.short_description,
      description: destination.description,
      hero_image_url: destination.hero_image_url || "",
      hero_video_url: destination.hero_video_url || "",
      card_image_url: destination.card_image_url || "",
      published: destination.published,
      sort_order: destination.sort_order,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Destination name is required", variant: "destructive" });
      return;
    }

    const nextSlug = slugify(form.slug || form.name);
    if (!nextSlug) {
      toast({ title: "Destination slug is required", variant: "destructive" });
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      slug: nextSlug,
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      short_description: form.short_description.trim(),
      description: form.description.trim(),
      hero_image_url: form.hero_image_url.trim() || null,
      hero_video_url: form.hero_video_url.trim() || null,
      card_image_url: form.card_image_url.trim() || null,
    };

    const operation = creating
      ? supabase.from("destinations").insert(payload)
      : supabase.from("destinations").update(payload).eq("id", editing?.id || "");

    const { error } = await operation;
    setSaving(false);

    if (error) {
      toast({ title: creating ? "Could not create destination" : "Could not update destination", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: creating ? "Destination created" : "Destination updated" });
    cancel();
    void fetchDestinations();
  };

  const handleDelete = async (destination: Destination) => {
    const stats = destinationStats[destination.id] || { packages: 0, posts: 0 };

    if (stats.packages > 0 || stats.posts > 0) {
      toast({
        title: "Reassign linked content first",
        description: `${destination.name} still has ${stats.packages} package(s) and ${stats.posts} blog post(s) connected to it.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Delete ${destination.name}? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from("destinations").delete().eq("id", destination.id);
    if (error) {
      toast({ title: "Could not delete destination", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Destination deleted" });
    if (editing?.id === destination.id) {
      cancel();
    }
    void fetchDestinations();
  };

  const isEditorOpen = creating || !!editing;
  const previewImage = form.card_image_url || form.hero_image_url || "/placeholder.svg";
  const previewSlug = slugify(form.slug || form.name);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Destinations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the places that power your package filters, destination pages, and blog associations.</p>
        </div>
        {!isEditorOpen && (
          <Button onClick={startCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Destination
          </Button>
        )}
      </div>

      {isEditorOpen ? (
        <div className="bg-card rounded-xl p-6 shadow-elegant space-y-5 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold">{creating ? "New Destination" : "Edit Destination"}</h2>
              <p className="text-sm text-muted-foreground mt-1">Published destinations appear in the main navigation and on the homepage.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Destination Name *"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                <Input
                  placeholder="Slug"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Tagline"
                  value={form.tagline}
                  onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
                />
                <Input
                  placeholder="Sort Order"
                  type="number"
                  value={form.sort_order}
                  onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))}
                />
              </div>

              <Input
                placeholder="Short Description"
                value={form.short_description}
                onChange={(event) => setForm((current) => ({ ...current, short_description: event.target.value }))}
              />

              <Textarea
                placeholder="Full destination description"
                rows={6}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Hero Image URL"
                  value={form.hero_image_url}
                  onChange={(event) => setForm((current) => ({ ...current, hero_image_url: event.target.value }))}
                />
                <Input
                  placeholder="Card Image URL"
                  value={form.card_image_url}
                  onChange={(event) => setForm((current) => ({ ...current, card_image_url: event.target.value }))}
                />
              </div>

              <Input
                placeholder="Hero Video URL"
                value={form.hero_video_url}
                onChange={(event) => setForm((current) => ({ ...current, hero_video_url: event.target.value }))}
              />

              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <Switch checked={form.published} onCheckedChange={(value) => setForm((current) => ({ ...current, published: value }))} />
                <div>
                  <p className="text-sm font-medium text-foreground">Published</p>
                  <p className="text-xs text-muted-foreground">Unpublished destinations stay hidden from the public website.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border overflow-hidden bg-muted">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={previewImage} alt={form.name || "Destination preview"} className="h-full w-full object-cover" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <ImagePlus className="h-3.5 w-3.5" />
                    Live Preview
                  </div>
                  <p className="text-lg font-display font-semibold text-foreground">{form.name || "Destination name"}</p>
                  <p className="text-sm text-muted-foreground">{form.tagline || form.short_description || "Add a tagline or short description for your destination card."}</p>
                  <p className="text-xs text-muted-foreground">URL: /destinations/{previewSlug || "destination-slug"}</p>
                  {previewSlug && (
                    <a
                      href={`/destinations/${previewSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Open destination page
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {editing && (
                <div className="rounded-xl border border-border p-4 bg-background">
                  <p className="text-sm font-medium text-foreground">Connected content</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {destinationStats[editing.id]?.packages || 0} package(s) and {destinationStats[editing.id]?.posts || 0} blog post(s)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : creating ? "Create Destination" : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={cancel}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : destinations.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No destinations yet.</p>
          ) : (
            destinations.map((destination) => (
              <div key={destination.id} className="bg-card rounded-xl p-4 shadow-elegant flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={destination.card_image_url || destination.hero_image_url || "/placeholder.svg"}
                    alt={destination.name}
                    className="h-16 w-16 rounded-xl object-cover bg-muted"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground">{destination.name}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${destination.published ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {destination.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{destination.tagline || "No tagline"} • /destinations/{destination.slug}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {destinationStats[destination.id]?.packages || 0} package(s) • {destinationStats[destination.id]?.posts || 0} blog post(s)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(destination)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(destination)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  );
}
