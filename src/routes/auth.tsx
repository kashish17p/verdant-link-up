import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/" }); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success("Check your email to confirm your account."); setMode("signin"); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success("Welcome back!"); navigate({ to: "/" }); }
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Google sign-in failed");
    else if (!res.redirected) navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-16 flex justify-center">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </span>
          </div>
          <h1 className="font-display text-3xl text-center">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
          <p className="text-center text-muted-foreground mt-2">{mode === "signin" ? "Sign in to manage your garden" : "Join GreenNest to start planting"}</p>

          <Button variant="outline" onClick={google} className="w-full mt-8 rounded-full">Continue with Google</Button>
          <div className="flex items-center gap-3 my-5"><div className="flex-1 border-t" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 border-t" /></div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div><label className="text-sm font-medium">Full name</label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" /></div>
            )}
            <div><label className="text-sm font-medium">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" /></div>
            <div><label className="text-sm font-medium">Password</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1" /></div>
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>{loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-5">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-medium underline">
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </p>
          <p className="text-center mt-6"><Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link></p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
