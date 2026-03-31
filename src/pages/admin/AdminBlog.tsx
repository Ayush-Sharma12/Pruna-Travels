import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { extractStoragePath, resolveDestinationName, slugify } from "@/lib/cms";
import { ExternalLink, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogMedia = Database["public"]["Tables"]["blog_media"]["Row"];
type Destination = Database["public"]["Tables"]["destinations"]["Row"];

type BlogPostListItem = BlogPost & {
  destination_record: Destination | null;
};

const NO_DESTINATION_VALUE = "__no_destination__";

const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image: "",
  destinationId: "",
  published: false,
};

export default function AdminBlog() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [editing, setEditing] = useState<BlogPostListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [form, setForm] = useState(emptyPost);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, destination_record:destinations!blog_posts_destination_id_fkey(*)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load blog posts", description: error.message, variant: "destructive" });
      setPosts([]);
    } else {
      setPosts((data as BlogPostListItem[]) || []);
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
  }, [toast]);

  const fetchMedia = async (postId: string) => {
    const { data, error } = await supabase
      .from("blog_media")
      .select("*")
      .eq("blog_post_id", postId)
      .order("sort_order");

    if (error) {
      toast({ title: "Failed to load blog media", description: error.message, variant: "destructive" });
      setMedia([]);
      return;
    }

    setMedia(data || []);
  };

  useEffect(() => {
    void Promise.all([fetchPosts(), fetchDestinations()]);
  }, [fetchDestinations, fetchPosts]);

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setMedia([]);
    setSaving(false);
    setForm(emptyPost);
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setMedia([]);
    setForm(emptyPost);
  };

  const startEdit = (post: BlogPostListItem) => {
    setEditing(post);
    setCreating(false);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image || "",
      destinationId: post.destination_id || "",
      published: post.published || false,
    });
    void fetchMedia(post.id);
  };

  const handleSave = async () => {
    const nextSlug = slugify(form.slug || form.title);
    const selectedDestination = destinations.find((destination) => destination.id === form.destinationId);

    if (!form.title.trim() || !nextSlug) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);

    const payload = {
      slug: nextSlug,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      image: form.image.trim() || null,
      destination_id: selectedDestination?.id || null,
      destination: selectedDestination?.name || null,
      published: form.published,
    };

    if (creating) {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(payload)
        .select("*, destination_record:destinations!blog_posts_destination_id_fkey(*)")
        .single();
      setSaving(false);

      if (error) {
        toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Blog post created. You can upload media now." });
      setCreating(false);
      setEditing(data as BlogPostListItem);
      void Promise.all([fetchPosts(), fetchMedia(data.id)]);
      return;
    }

    if (!editing) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
    setSaving(false);

    if (error) {
      toast({ title: "Failed to update post", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Blog post updated" });
    void fetchPosts();
  };

  const handleDelete = async (post: BlogPostListItem) => {
    if (!confirm(`Delete ${post.title} and all attached media?`)) return;

    const { data: mediaFiles } = await supabase.from("blog_media").select("url").eq("blog_post_id", post.id);

    const paths = [
      ...(mediaFiles || []).map((item) => extractStoragePath(item.url, "blog-media")),
      ...(post.image ? [extractStoragePath(post.image, "blog-media")] : []),
    ].filter(Boolean);

    if (paths.length) {
      await supabase.storage.from("blog-media").remove(paths);
    }

    const { error } = await supabase.from("blog_posts").delete().eq("id", post.id);
    if (error) {
      toast({ title: "Failed to delete post", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Blog post deleted" });
    if (editing?.id === post.id) {
      cancel();
    }
    void fetchPosts();
  };

  const uploadToBlogStorage = async (file: File, pathPrefix: string) => {
    const extension = file.name.split(".").pop();
    const path = `${pathPrefix}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("blog-media").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const publicUrl = await uploadToBlogStorage(file, "covers");
      setForm((current) => ({ ...current, image: publicUrl }));
      toast({ title: "Cover uploaded" });
    } catch (error) {
      toast({ title: "Cover upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>, postId: string) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploadingMedia(true);

    for (const [index, file] of Array.from(files).entries()) {
      try {
        const publicUrl = await uploadToBlogStorage(file, postId);
        const { error } = await supabase.from("blog_media").insert({
          blog_post_id: postId,
          type: file.type.startsWith("video") ? "video" : "image",
          url: publicUrl,
          sort_order: media.length + index,
        });

        if (error) {
          toast({ title: "Media upload failed", description: error.message, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Media upload failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
      }
    }

    await fetchMedia(postId);
    setUploadingMedia(false);
    event.target.value = "";
    toast({ title: "Media uploaded" });
  };

  const handleDeleteMedia = async (item: BlogMedia) => {
    const path = extractStoragePath(item.url, "blog-media");
    if (path) {
      await supabase.storage.from("blog-media").remove([path]);
    }

    const { error } = await supabase.from("blog_media").delete().eq("id", item.id);
    if (error) {
      toast({ title: "Failed to delete media", description: error.message, variant: "destructive" });
      return;
    }

    setMedia((current) => current.filter((entry) => entry.id !== item.id));
    toast({ title: "Media deleted" });
  };

  const isEditorOpen = creating || !!editing;
  const selectedDestination = destinations.find((destination) => destination.id === form.destinationId) || null;
  const previewSlug = slugify(form.slug || form.title);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Blog Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Publish destination stories, guides, and campaign posts from one editor.</p>
        </div>
        {!isEditorOpen && (
          <Button onClick={startCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            New Post
          </Button>
        )}
      </div>

      {isEditorOpen ? (
        <div className="bg-card rounded-xl p-6 shadow-elegant space-y-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold">{creating ? "New Post" : "Edit Post"}</h2>
              <p className="text-sm text-muted-foreground mt-1">Attach a destination when the article should show up as destination-linked content, or leave it general.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Post Title *"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                />
                <Input
                  placeholder="Slug"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                />
              </div>

              <Input
                placeholder="Excerpt"
                value={form.excerpt}
                onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
              />

              <Textarea
                placeholder="Blog content"
                rows={14}
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={form.destinationId || NO_DESTINATION_VALUE} onValueChange={(value) => setForm((current) => ({ ...current, destinationId: value === NO_DESTINATION_VALUE ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DESTINATION_VALUE}>General post</SelectItem>
                    {destinations.map((destination) => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {destination.name}{destination.published ? "" : " (Draft)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Cover image URL"
                  value={form.image}
                  onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                />
              </div>

              <label className="cursor-pointer block">
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Upload className="h-5 w-5 mx-auto mb-1" />
                  {uploadingCover ? "Uploading cover..." : "Upload cover image"}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                />
              </label>

              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <Switch checked={form.published} onCheckedChange={(value) => setForm((current) => ({ ...current, published: value }))} />
                <div>
                  <p className="text-sm font-medium text-foreground">Published</p>
                  <p className="text-xs text-muted-foreground">Draft posts stay editable in admin and hidden on the public blog.</p>
                </div>
              </div>

              {editing && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Post Media</label>
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
                      {uploadingMedia ? "Uploading media..." : "Upload post images or videos"}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                      multiple
                      onChange={(event) => handleMediaUpload(event, editing.id)}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border overflow-hidden bg-muted">
                {(form.image || media.find((item) => item.type === "image")?.url) ? (
                  <img
                    src={form.image || media.find((item) => item.type === "image")?.url}
                    alt={form.title || "Blog preview"}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="aspect-video flex items-center justify-center text-sm text-muted-foreground">No cover image yet</div>
                )}
                <div className="p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
                  <p className="text-lg font-display font-semibold text-foreground">{form.title || "Blog title"}</p>
                  <p className="text-sm text-muted-foreground">{selectedDestination?.name || "General post"}</p>
                  <p className="text-xs text-muted-foreground">URL: /blog/{previewSlug || "post-slug"}</p>
                  {previewSlug && (
                    <a
                      href={`/blog/${previewSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Open blog post
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : creating ? "Create Post" : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={cancel}>Back to List</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No blog posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-card rounded-xl p-4 shadow-elegant flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-foreground">{post.title}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${post.published ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {resolveDestinationName(post.destination_record, post.destination) || "General"} - {new Date(post.created_at).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">/{post.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(post)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(post)}>
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
