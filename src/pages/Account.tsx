import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];

export default function AccountPage() {
  const { toast } = useToast();
  const { user, isAdmin, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });

  const fetchAccountData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const [profileResult, enquiriesResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("enquiries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profileResult.error) {
      toast({ title: "Failed to load profile", description: profileResult.error.message, variant: "destructive" });
    } else {
      setProfile(profileResult.data);
      setForm({
        full_name: profileResult.data?.full_name || user.user_metadata?.full_name || "",
        phone: profileResult.data?.phone || "",
      });
    }

    if (enquiriesResult.error) {
      toast({ title: "Failed to load enquiries", description: enquiriesResult.error.message, variant: "destructive" });
    } else {
      setEnquiries(enquiriesResult.data || []);
    }

    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    void fetchAccountData();
  }, [fetchAccountData]);

  const handleProfileSave = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
    });
    setSaving(false);

    if (error) {
      toast({ title: "Failed to save profile", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Profile updated" });
    void fetchAccountData();
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground">My Account</h1>
              <p className="mt-2 text-muted-foreground">Manage your details and see the enquiries you have sent through the website.</p>
            </div>
            <div className="flex gap-3">
              {isAdmin && (
                <Button asChild variant="outline">
                  <Link to="/admin">Open Admin Panel</Link>
                </Button>
              )}
              <Button variant="ghost" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-card rounded-2xl p-6 shadow-elegant space-y-4">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
              </div>

              <Input
                placeholder="Full Name"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              />
              <Input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
              <Button onClick={handleProfileSave} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>

              {profile && (
                <p className="text-xs text-muted-foreground">
                  Account created on {new Date(profile.created_at).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>

            <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-elegant">
              <div className="mb-6">
                <h2 className="text-xl font-display font-bold text-foreground">My Enquiries</h2>
                <p className="text-sm text-muted-foreground mt-1">Every enquiry submitted while signed in appears here.</p>
              </div>

              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : enquiries.length === 0 ? (
                <p className="text-muted-foreground">No enquiries found yet. Explore packages and send your first enquiry.</p>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((enquiry) => (
                    <div key={enquiry.id} className="border border-border rounded-xl p-4">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{enquiry.destination || "General travel enquiry"}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(enquiry.created_at).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="text-xs font-bold uppercase bg-primary/10 text-primary px-2 py-1 rounded-full">{enquiry.status}</span>
                      </div>

                      {enquiry.message && (
                        <p className="text-sm text-muted-foreground mt-3">{enquiry.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
