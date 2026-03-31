import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Copy, KeyRound, ShieldCheck, Trash2 } from "lucide-react";

type AdminSignupCode = Database["public"]["Tables"]["admin_signup_codes"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

type AdminProfile = Profile & {
  role: UserRole["role"];
};

const emptyCodeForm = {
  code: "",
  description: "",
  active: true,
};

function generateAccessCode() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PTH-ADMIN-${suffix}`;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [signupCodes, setSignupCodes] = useState<AdminSignupCode[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyCodeForm);

  const fetchSettings = useCallback(async () => {
    setLoading(true);

    const [{ data: codeRows, error: codeError }, { data: roleRows, error: roleError }] = await Promise.all([
      supabase.from("admin_signup_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*").eq("role", "admin"),
    ]);

    if (codeError) {
      toast({ title: "Failed to load signup codes", description: codeError.message, variant: "destructive" });
      setSignupCodes([]);
    } else {
      setSignupCodes(codeRows || []);
    }

    if (roleError) {
      toast({ title: "Failed to load admin users", description: roleError.message, variant: "destructive" });
      setAdmins([]);
      setLoading(false);
      return;
    }

    const adminUserIds = (roleRows || []).map((role) => role.user_id);
    if (adminUserIds.length === 0) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", adminUserIds);

    if (profileError) {
      toast({ title: "Failed to load admin profiles", description: profileError.message, variant: "destructive" });
      setAdmins([]);
      setLoading(false);
      return;
    }

    const nextAdmins = adminUserIds.map((userId) => {
      const profile = (profileRows || []).find((row) => row.id === userId);
      return {
        id: userId,
        created_at: profile?.created_at || "",
        full_name: profile?.full_name || "Admin User",
        phone: profile?.phone || null,
        updated_at: profile?.updated_at || "",
        role: "admin" as const,
      };
    });

    setAdmins(nextAdmins);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleCreateCode = async () => {
    if (!form.code.trim()) {
      toast({ title: "Access code is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("admin_signup_codes").insert({
      code: form.code.trim(),
      description: form.description.trim(),
      active: form.active,
    });
    setSaving(false);

    if (error) {
      toast({ title: "Could not create code", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Admin signup code created" });
    setForm(emptyCodeForm);
    void fetchSettings();
  };

  const handleToggleCode = async (signupCode: AdminSignupCode, active: boolean) => {
    const { error } = await supabase.from("admin_signup_codes").update({ active }).eq("id", signupCode.id);
    if (error) {
      toast({ title: "Could not update code", description: error.message, variant: "destructive" });
      return;
    }

    setSignupCodes((current) => current.map((item) => (item.id === signupCode.id ? { ...item, active } : item)));
    toast({ title: active ? "Code activated" : "Code deactivated" });
  };

  const handleDeleteCode = async (signupCode: AdminSignupCode) => {
    if (!confirm(`Delete signup code ${signupCode.code}?`)) {
      return;
    }

    const { error } = await supabase.from("admin_signup_codes").delete().eq("id", signupCode.id);
    if (error) {
      toast({ title: "Could not delete code", description: error.message, variant: "destructive" });
      return;
    }

    setSignupCodes((current) => current.filter((item) => item.id !== signupCode.id));
    toast({ title: "Signup code deleted" });
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Code copied" });
    } catch {
      toast({ title: "Could not copy code", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage admin onboarding codes and see which profiles currently hold admin access.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-elegant">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Admin Signup Codes</h2>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Access code"
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                />
                <Button variant="outline" onClick={() => setForm((current) => ({ ...current, code: generateAccessCode() }))}>
                  Generate
                </Button>
              </div>
              <Input
                placeholder="Description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <Switch checked={form.active} onCheckedChange={(value) => setForm((current) => ({ ...current, active: value }))} />
                <div>
                  <p className="text-sm font-medium text-foreground">Code active</p>
                  <p className="text-xs text-muted-foreground">Inactive codes stay stored but cannot be used for admin signup.</p>
                </div>
              </div>
              <Button onClick={handleCreateCode} disabled={saving}>
                {saving ? "Creating..." : "Create Signup Code"}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-elegant">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Existing Codes</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : signupCodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signup codes created yet.</p>
            ) : (
              <div className="space-y-3">
                {signupCodes.map((signupCode) => (
                  <div key={signupCode.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-sm text-foreground">{signupCode.code}</p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${signupCode.active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {signupCode.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{signupCode.description || "No description"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(signupCode.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyCode(signupCode.code)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch checked={signupCode.active} onCheckedChange={(value) => handleToggleCode(signupCode, value)} />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteCode(signupCode)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-elegant">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Current Admins</h2>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin users found.</p>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="rounded-xl border border-border p-4">
                    <p className="font-medium text-foreground">{admin.full_name || "Admin User"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{admin.phone || "No phone saved"}</p>
                    <p className="text-xs text-muted-foreground mt-1">User ID: {admin.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-6 shadow-elegant">
            <h2 className="text-lg font-display font-semibold text-foreground mb-3">How This Works</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Create a code here, share it privately, and the recipient can use it from the admin signup screen.</p>
              <p>Deactivating a code does not remove existing admins. It only stops future claims.</p>
              <p>The current project still treats role assignment as admin-only, so regular users cannot grant themselves access without one of these codes.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
