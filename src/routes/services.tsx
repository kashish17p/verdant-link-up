import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Scissors, Sprout, TreePine } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Book a Gardener — GreenNest" }, { name: "description", content: "Schedule home gardening, lawn maintenance & plant care with verified gardeners." }] }),
  component: ServicesPage,
});

const ICONS: Record<string, any> = { lawn: TreePine, prune: Scissors, garden: Sprout };

function ServicesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<any | null>(null);
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("gardener_services").select("*").eq("is_active", true)).data ?? [],
  });

  // Demo services if none seeded
  const demoServices = services.length ? services : [
    { id: "demo-1", title: "Home Gardening Visit", description: "Planting, soil prep & care for your garden.", price: 599, duration_minutes: 90 },
    { id: "demo-2", title: "Lawn Maintenance", description: "Mowing, edging and seasonal lawn care.", price: 799, duration_minutes: 120 },
    { id: "demo-3", title: "Plant Care & Pruning", description: "Pruning, repotting and plant health checks.", price: 449, duration_minutes: 60 },
  ];

  const handleBook = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!selected || selected.id?.startsWith("demo")) { toast.error("Choose a real service (admin needs to add gardeners)."); return; }
    if (!date) { toast.error("Pick a date & time"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id,
      service_id: selected.id,
      gardener_id: selected.gardener_id,
      scheduled_at: new Date(date).toISOString(),
      address, notes, price: selected.price,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Booking requested!"); navigate({ to: "/dashboard" }); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl">Verified gardeners on demand</h1>
          <p className="text-muted-foreground mt-2">Choose a service, pick a time, and we'll match you with a vetted local pro.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {demoServices.map((s: any, i: number) => {
            const Icon = [Sprout, TreePine, Scissors][i % 3];
            const isSelected = selected?.id === s.id;
            return (
              <button key={s.id} onClick={() => setSelected(s)} className={`text-left p-6 rounded-2xl border bg-card transition ${isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}`}>
                <Icon className="h-7 w-7 text-primary" />
                <h3 className="font-display text-xl mt-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="font-display text-lg">₹{Number(s.price).toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">{s.duration_minutes} min</span>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-10 max-w-xl p-6 rounded-2xl border bg-card">
            <h2 className="font-display text-2xl">Book: {selected.title}</h2>
            <div className="grid gap-4 mt-5">
              <div>
                <label className="text-sm font-medium">Date & time</label>
                <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Service address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific requirements..." className="mt-1" />
              </div>
              {!user && <p className="text-sm text-muted-foreground"><Link to="/auth" className="text-primary underline">Sign in</Link> to confirm booking.</p>}
              <Button onClick={handleBook} disabled={submitting} className="rounded-full">{submitting ? "Booking..." : "Request booking"}</Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
