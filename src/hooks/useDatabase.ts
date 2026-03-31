import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PkgRow = Database["public"]["Tables"]["packages"]["Row"];
type PackageMediaRow = Database["public"]["Tables"]["package_media"]["Row"];
type BlogRow = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogMediaRow = Database["public"]["Tables"]["blog_media"]["Row"];
type DestinationRow = Database["public"]["Tables"]["destinations"]["Row"];

export interface PackageWithMedia extends PkgRow {
  package_media: PackageMediaRow[];
  destination_record: DestinationRow | null;
}

export interface BlogPostWithMedia extends BlogRow {
  blog_media: BlogMediaRow[];
  destination_record: DestinationRow | null;
}

async function fetchPackagesQuery(destinationId?: string, destinationName?: string, featured?: boolean, limit?: number) {
  let query = supabase
    .from("packages")
    .select("*, package_media(*), destination_record:destinations!packages_destination_id_fkey(*)")
    .order("created_at", { ascending: false });

  if (destinationId) {
    query = query.eq("destination_id", destinationId);
  } else if (destinationName) {
    query = query.eq("destination", destinationName);
  }

  if (featured !== undefined) query = query.eq("featured", featured);
  if (limit) query = query.limit(limit);

  return query;
}

export function usePackages(destinationId?: string, destinationName?: string) {
  const [packages, setPackages] = useState<PackageWithMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await fetchPackagesQuery(destinationId, destinationName);
        if (error) {
          console.error("Error fetching packages:", error);
          setPackages([]);
          return;
        }
        setPackages((data as PackageWithMedia[]) || []);
      } catch (err) {
        console.error("Unexpected error fetching packages:", err);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [destinationId, destinationName]);

  return { packages, loading };
}

export function useFeaturedPackages() {
  const [packages, setPackages] = useState<PackageWithMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await fetchPackagesQuery(undefined, undefined, true, 6);
        if (error) {
          console.error("Error fetching featured packages:", error);
          setPackages([]);
          return;
        }
        setPackages((data as PackageWithMedia[]) || []);
      } catch (err) {
        console.error("Unexpected error fetching featured packages:", err);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  return { packages, loading };
}

export function usePackageBySlug(slug: string | undefined) {
  const [pkg, setPkg] = useState<PackageWithMedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("packages")
          .select("*, package_media(*), destination_record:destinations!packages_destination_id_fkey(*)")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          console.error("Error fetching package:", error);
          setPkg(null);
          return;
        }

        setPkg((data as PackageWithMedia | null) ?? null);
      } catch (err) {
        console.error("Unexpected error fetching package:", err);
        setPkg(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [slug]);

  return { pkg, loading };
}

export function useDestinations(includeDrafts = false) {
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from("destinations").select("*").order("sort_order").order("name");
        if (!includeDrafts) query = query.eq("published", true);
        const { data, error } = await query;

        if (error) {
          console.error("Error fetching destinations:", error);
          setDestinations([]);
          return;
        }

        setDestinations(data || []);
      } catch (err) {
        console.error("Unexpected error fetching destinations:", err);
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [includeDrafts]);

  return { destinations, loading };
}

export function useDestinationBySlug(slug: string | undefined) {
  const [destination, setDestination] = useState<DestinationRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("destinations")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          console.error("Error fetching destination:", error);
          setDestination(null);
          return;
        }

        setDestination(data);
      } catch (err) {
        console.error("Unexpected error fetching destination:", err);
        setDestination(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [slug]);

  return { destination, loading };
}

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPostWithMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*, blog_media(*), destination_record:destinations!blog_posts_destination_id_fkey(*)")
          .eq("published", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching blog posts:", error);
          setPosts([]);
          return;
        }

        setPosts((data as BlogPostWithMedia[]) || []);
      } catch (err) {
        console.error("Unexpected error fetching blog posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  return { posts, loading };
}

export function useBlogPostBySlug(slug: string | undefined) {
  const [post, setPost] = useState<BlogPostWithMedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*, blog_media(*), destination_record:destinations!blog_posts_destination_id_fkey(*)")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          console.error("Error fetching blog post:", error);
          setPost(null);
          return;
        }

        setPost((data as BlogPostWithMedia | null) ?? null);
      } catch (err) {
        console.error("Unexpected error fetching blog post:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [slug]);

  return { post, loading };
}
