import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiRegister, apiBulkSyncTasks, apiSyncStats } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const TASKS_KEY = "dfr.tasks.v1";
const STATS_KEY = "dfr.stats.v1";

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    try {
      const { user } = await apiRegister(email, name, password);
      setUser(user);

      // Migrate any existing localStorage data to the backend
      try {
        const localTasks = JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]");
        const localStats = JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}");
        if (localTasks.length > 0) await apiBulkSyncTasks(localTasks);
        if (localStats.decisionsAvoidedToday !== undefined) await apiSyncStats(localStats);
      } catch {
        // Migration failure is non-fatal
      }

      toast.success(`Welcome, ${user.name}! Your data is now synced.`);
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
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
          <h1 className="font-display text-2xl sm:text-3xl mb-1">Create account</h1>
          <p className="text-muted-foreground text-sm mb-6">Sync your tasks and progress across all devices.</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

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
                placeholder="min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
