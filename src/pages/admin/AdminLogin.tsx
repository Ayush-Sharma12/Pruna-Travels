import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Lock, ShieldPlus } from "lucide-react";
import logo from "@/assets/logo.webp";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, claimAdminAccess, isAdmin, user, loading, adminLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", accessCode: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
    accessCode: "",
  });

  useEffect(() => {
    if (!loading && !adminLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [adminLoading, isAdmin, loading, navigate, user]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      setSubmitting(false);
      toast({ title: "Admin login failed", description: error.message, variant: "destructive" });
      return;
    }

    if (loginForm.accessCode.trim()) {
      const adminResult = await claimAdminAccess(loginForm.accessCode.trim());
      setSubmitting(false);

      if (adminResult.error || !adminResult.success) {
        toast({
          title: "Signed in, but admin access was not granted",
          description: adminResult.error?.message || "The admin access code is invalid or inactive.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Admin access confirmed" });
      navigate("/admin", { replace: true });
      return;
    }

    setSubmitting(false);
    toast({ title: "Checking admin access..." });
  };

  const handleAdminSignup = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const signupResult = await signUp({
      fullName: signupForm.fullName,
      email: signupForm.email,
      password: signupForm.password,
    });

    if (signupResult.error) {
      setSubmitting(false);
      toast({ title: "Signup failed", description: signupResult.error.message, variant: "destructive" });
      return;
    }

    if (signupResult.needsEmailConfirmation) {
      setSubmitting(false);
      toast({
        title: "Confirm your email first",
        description: "After confirming your email, sign in here and use the admin access code to claim admin rights.",
      });
      setMode("login");
      return;
    }

    const adminResult = await claimAdminAccess(signupForm.accessCode);
    setSubmitting(false);

    if (adminResult.error || !adminResult.success) {
      toast({
        title: "Admin access was not granted",
        description: adminResult.error?.message || "The admin access code is invalid or inactive.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Admin account created" });
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 shadow-elegant">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Purna Travels" className="h-12 w-12 mb-3" />
            <h1 className="font-display font-bold text-xl text-foreground">Admin Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in or create an admin account with an access code.</p>
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "signup")} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Admin Login</TabsTrigger>
              <TabsTrigger value="signup">Admin Signup</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Admin Email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                required
              />
              <Input
                placeholder="Admin Access Code (optional)"
                value={loginForm.accessCode}
                onChange={(event) => setLoginForm({ ...loginForm, accessCode: event.target.value })}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                <Lock className="mr-2 h-4 w-4" />
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminSignup} className="space-y-4">
              <Input
                placeholder="Full Name"
                value={signupForm.fullName}
                onChange={(event) => setSignupForm({ ...signupForm, fullName: event.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Admin Email"
                value={signupForm.email}
                onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
                required
                minLength={6}
              />
              <Input
                placeholder="Admin Access Code"
                value={signupForm.accessCode}
                onChange={(event) => setSignupForm({ ...signupForm, accessCode: event.target.value })}
                required
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                <ShieldPlus className="mr-2 h-4 w-4" />
                {submitting ? "Creating admin..." : "Create Admin Account"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
            <p>
              Regular traveller account? <Link to="/auth" className="text-primary hover:underline">Login or sign up here</Link>
            </p>
            <p>
              First-time admin setup requires a valid code stored in Supabase.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground mb-2">Admin controls available after login</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Add and publish destinations dynamically.</p>
              <p>Create packages, upload photos or videos, and update prices.</p>
              <p>Publish blog posts and manage customer enquiries.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
