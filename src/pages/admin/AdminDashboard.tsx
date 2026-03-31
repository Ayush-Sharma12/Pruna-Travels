import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { ArrowRight, FileText, MapPinned, MessageSquare, Package, Settings, TrendingUp } from "lucide-react";

interface Stats {
  packages: number;
  destinations: number;
  enquiries: number;
  newEnquiries: number;
  blogPosts: number;
  draftPosts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    packages: 0,
    destinations: 0,
    enquiries: 0,
    newEnquiries: 0,
    blogPosts: 0,
    draftPosts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [pkgs, destinations, enqs, newEnqs, blogs, draftBlogs] = await Promise.all([
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("destinations").select("id", { count: "exact", head: true }),
        supabase.from("enquiries").select("id", { count: "exact", head: true }),
        supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "NEW"),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("published", false),
      ]);

      setStats({
        packages: pkgs.count || 0,
        destinations: destinations.count || 0,
        enquiries: enqs.count || 0,
        newEnquiries: newEnqs.count || 0,
        blogPosts: blogs.count || 0,
        draftPosts: draftBlogs.count || 0,
      });
    };

    void fetchStats();
  }, []);

  const cards = [
    { label: "Packages", value: stats.packages, icon: Package, color: "text-primary" },
    { label: "Destinations", value: stats.destinations, icon: MapPinned, color: "text-secondary" },
    { label: "New Enquiries", value: stats.newEnquiries, icon: TrendingUp, color: "text-accent" },
    { label: "Draft Posts", value: stats.draftPosts, icon: FileText, color: "text-muted-foreground" },
  ];

  const quickLinks = [
    {
      title: "Manage Destinations",
      description: "Add places dynamically and keep packages linked to them.",
      href: "/admin/destinations",
      icon: MapPinned,
    },
    {
      title: "Manage Packages",
      description: "Create travel products with pricing, itineraries, and media.",
      href: "/admin/packages",
      icon: Package,
    },
    {
      title: "Manage Blog",
      description: "Publish destination stories, guides, and campaign content.",
      href: "/admin/blog",
      icon: FileText,
    },
    {
      title: "Admin Settings",
      description: "Control signup codes and keep the admin team organized.",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your content center for destinations, packages, blog posts, enquiries, and admin access.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl p-6 shadow-elegant">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="bg-card rounded-xl p-6 shadow-elegant">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href} className="rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-muted/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground">{link.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-elegant">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">At A Glance</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{stats.enquiries} total enquiries</p>
                <p className="text-sm text-muted-foreground">Track incoming leads and move them from new to contacted to closed.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{stats.blogPosts} total blog posts</p>
                <p className="text-sm text-muted-foreground">Published stories keep your homepage and blog section fresh.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
              <MapPinned className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{stats.destinations} destination records</p>
                <p className="text-sm text-muted-foreground">Destination records now power content links across packages, blog posts, and enquiry forms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
