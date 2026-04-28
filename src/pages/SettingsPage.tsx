import { useStore } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Mood } from "@/lib/types";

export default function SettingsPage() {
  const { settings, setSettings } = useStore();

  const Row = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-6 py-5 border-b border-border last:border-0">
      <div>
        <div className="font-medium">{title}</div>
        {hint && <div className="text-sm text-muted-foreground mt-1">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 md:p-10 max-w-3xl">
      <h1 className="font-display text-4xl md:text-5xl mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Tune Clarity to match your rhythm.</p>

      <div className="surface-card rounded-3xl p-6 md:p-8 border border-border/60">
        <Row title="Work hours" hint="We won't suggest work tasks outside this window.">
          <div className="flex gap-2 items-center">
            <Input type="time" value={settings.workStart} onChange={(e) => setSettings({ workStart: e.target.value })} className="w-28" />
            <span className="text-muted-foreground">→</span>
            <Input type="time" value={settings.workEnd} onChange={(e) => setSettings({ workEnd: e.target.value })} className="w-28" />
          </div>
        </Row>

        <Row title="Peak energy" hint="When are you sharpest? Hard tasks get scheduled here.">
          <Select value={settings.peakEnergy} onValueChange={(v) => setSettings({ peakEnergy: v as any })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="night">Night</SelectItem>
            </SelectContent>
          </Select>
        </Row>

        <Row title="Mood today" hint="Recommendations adjust to how you feel.">
          <Select value={settings.mood} onValueChange={(v) => setSettings({ mood: v as Mood })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="focused">Focused</SelectItem>
              <SelectItem value="energetic">Energetic</SelectItem>
              <SelectItem value="tired">Tired</SelectItem>
              <SelectItem value="stressed">Stressed</SelectItem>
            </SelectContent>
          </Select>
        </Row>

        <Row title="Notifications" hint="Gentle nudges only. Never spammy.">
          <Switch checked={settings.notifications} onCheckedChange={(v) => setSettings({ notifications: v })} />
        </Row>

        <Row title="3 Choices Only Mode" hint="Limit recommendations to 3 — the sweet spot for fast decisions.">
          <Switch checked={settings.threeChoicesMode} onCheckedChange={(v) => setSettings({ threeChoicesMode: v })} />
        </Row>

        <Row title="Dark mode" hint="Easier on the eyes for evening work.">
          <Switch checked={settings.darkMode} onCheckedChange={(v) => setSettings({ darkMode: v })} />
        </Row>
      </div>

      <div className="mt-8 surface-card rounded-3xl p-6 border border-border/60">
        <h3 className="font-display text-xl mb-2">Calendar sync</h3>
        <p className="text-sm text-muted-foreground mb-4">Coming soon — connect Google or Apple calendar to auto-block focus time.</p>
        <div className="flex gap-2">
          <button disabled className="px-4 py-2 rounded-full border border-border bg-muted text-muted-foreground text-sm cursor-not-allowed">Connect Google</button>
          <button disabled className="px-4 py-2 rounded-full border border-border bg-muted text-muted-foreground text-sm cursor-not-allowed">Connect Apple</button>
        </div>
      </div>
    </div>
  );
}
