import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiLogin } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { user } = await apiLogin(email, password);
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="size-10 rounded-2xl bg-gradient-hero flex items-center justify-center">
            <Brain className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl">Clarity</span>
        </div>

        <div className="surface-card rounded-3xl border border-border/60 p-6 sm:p-8">
          <h1 className="font-display text-2xl sm:text-3xl mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to sync your tasks across devices.</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline underline-offset-4">
              Create one
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-center text-xs text-muted-foreground">
              Or{" "}
              <Link to="/dashboard" className="text-primary hover:underline underline-offset-4">
                continue without an account
              </Link>{" "}
              (data stays on this device only)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
