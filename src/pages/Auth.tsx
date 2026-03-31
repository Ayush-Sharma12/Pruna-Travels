import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.webp";

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ fullName: "", email: "", password: "" });

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await signIn(loginForm.email, loginForm.password);
    setSubmitting(false);

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Welcome back" });
    navigate("/account");
  };

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const { error, needsEmailConfirmation } = await signUp(signupForm);
    setSubmitting(false);

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: needsEmailConfirmation ? "Check your email" : "Account created",
      description: needsEmailConfirmation
        ? "Confirm your email, then sign in to continue."
        : "Your account is ready. You can now use your dashboard.",
    });

    if (!needsEmailConfirmation) {
      navigate("/account");
    } else {
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 shadow-elegant">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Purna Travels" className="h-12 w-12 mb-3" />
            <h1 className="font-display font-bold text-xl text-foreground">Account Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in or create an account to track your travel enquiries.</p>
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "signup")} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
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
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                placeholder="Full Name"
                value={signupForm.fullName}
                onChange={(event) => setSignupForm({ ...signupForm, fullName: event.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email"
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
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Need admin access? <Link to="/admin/login" className="text-primary hover:underline">Use the admin portal</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
