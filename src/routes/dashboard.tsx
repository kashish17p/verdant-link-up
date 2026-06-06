import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").eq("customer_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("bookings").select("*, gardener_services(title)").eq("customer_id", user!.id).order("scheduled_at", { ascending: false })).data ?? [],
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl">My account</h1>
        <p className="text-muted-foreground mt-1">{user.email}</p>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-6 space-y-4">
            {orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : orders.map((o: any) => (
              <div key={o.id} className="p-5 rounded-2xl border bg-card">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · <span className="capitalize">{o.status}</span></p>
                  </div>
                  <p className="font-display text-lg">₹{Number(o.total).toFixed(0)}</p>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {o.order_items?.map((it: any) => <div key={it.id}>{it.product_name} × {it.quantity}</div>)}
                </div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="bookings" className="mt-6 space-y-4">
            {bookings.length === 0 ? <p className="text-muted-foreground">No bookings yet.</p> : bookings.map((b: any) => (
              <div key={b.id} className="p-5 rounded-2xl border bg-card">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{b.gardener_services?.title ?? "Service"}</p>
                    <p className="text-sm text-muted-foreground">{new Date(b.scheduled_at).toLocaleString()} · <span className="capitalize">{b.status}</span></p>
                    {b.address && <p className="text-sm text-muted-foreground mt-1">{b.address}</p>}
                  </div>
                  <p className="font-display text-lg">₹{Number(b.price).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
