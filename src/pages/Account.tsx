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

const initialForm = {
  full_name: "",
  phone: "",
};

export default function AccountPage() {
  const { toast } = useToast();
  const { user, isAdmin, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showError = (title: string, message: string) =>
    toast({
      title,
      description: message,
      variant: "destructive",
    });

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchProfile = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      showError("Failed to load profile", error.message);
      return null;
    }

    return data;
  };

  const fetchEnquiries = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Failed to load enquiries", error.message);
      return [];
    }

    return data || [];
  };

  const fetchAccountData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const [profileData, enquiriesData] = await Promise.all([
      fetchProfile(),
      fetchEnquiries(),
    ]);

    if (profileData) {
      setProfile(profileData);

      setForm({
        full_name:
          profileData.full_name ||
          user.user_metadata?.full_name ||
          "",
        phone: profileData.phone || "",
      });
    }

    setEnquiries(enquiriesData);
    setLoading(false);
  }, [user]);

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
      showError("Failed to save profile", error.message);
      return;
    }

    toast({ title: "Profile updated" });
    void fetchAccountData();
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  const renderEnquiries = () => {
    if (loading) {
      return <p className="text-muted-foreground">Loading...</p>;
    }

    if (!enquiries.length) {
      return (
        <p className="text-muted-foreground">
          No enquiries found yet. Explore packages and send your first enquiry.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {enquiries.map((enquiry) => (
          <div
            key={enquiry.id}
            className="border border-border rounded-xl p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">
                  {enquiry.destination || "General travel enquiry"}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {new Date(enquiry.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <span className="text-xs font-bold uppercase bg-primary/10 text-primary px-2 py-1 rounded-full">
                {enquiry.status}
              </span>
            </div>

            {enquiry.message && (
              <p className="mt-3 text-sm text-muted-foreground">
                {enquiry.message}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-display font-bold">
                My Account
              </h1>

              <p className="mt-2 text-muted-foreground">
                Manage your details and see the enquiries you have sent through
                the website.
              </p>
            </div>

            <div className="flex gap-3">
              {isAdmin && (
                <Button asChild variant="outline">
                  <Link to="/admin">Open Admin Panel</Link>
                </Button>
              )}

              <Button variant="ghost" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-6 shadow-elegant space-y-4">
              <div>
                <h2 className="text-xl font-display font-bold">
                  Profile
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>

              <Input
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) =>
                  updateForm("full_name", e.target.value)
                }
              />

              <Input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) =>
                  updateForm("phone", e.target.value)
                }
              />

              <Button
                onClick={handleProfileSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>

              {profile && (
                <p className="text-xs text-muted-foreground">
                  Account created on{" "}
                  {new Date(profile.created_at).toLocaleDateString(
                    "en-IN"
                  )}
                </p>
              )}
            </div>

            <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-elegant">
              <div className="mb-6">
                <h2 className="text-xl font-display font-bold">
                  My Enquiries
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Every enquiry submitted while signed in appears here.
                </p>
              </div>

              {renderEnquiries()}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
