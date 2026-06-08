import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/admin")({ component: AdminPanel });

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const BOOKING_STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

function AdminPanel() {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("products").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("bookings").select("*, gardener_services(title)").order("scheduled_at", { ascending: false })).data ?? [],
  });
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  const { data: apps = [] } = useQuery({
    queryKey: ["admin-vendor-apps"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("vendor_applications").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["admin-audit-logs"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    await logAudit({ actorId: user!.id, actorRole: "admin", action: "order.status_changed", entityType: "order", entityId: id, metadata: { status } });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking updated");
    await logAudit({ actorId: user!.id, actorRole: "admin", action: "booking.status_changed", entityType: "booking", entityId: id, metadata: { status } });
    qc.invalidateQueries({ queryKey: ["admin-bookings"] });
  };

  const grantRole = async (userId: string, role: "admin" | "vendor" | "gardener" | "customer") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    await logAudit({ actorId: user!.id, actorRole: "admin", action: "role.granted", entityType: "user", entityId: userId, metadata: { role } });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const revokeRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    if (error) return toast.error(error.message);
    toast.success("Revoked");
    await logAudit({ actorId: user!.id, actorRole: "admin", action: "role.revoked", entityType: "user", entityId: userId, metadata: { role } });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const toggleProductActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit({ actorId: user!.id, actorRole: "admin", action: current ? "product.hidden" : "product.shown", entityType: "product", entityId: id });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const reviewApp = async (app: any, decision: "approved" | "rejected", notes: string) => {
    const { error } = await supabase.from("vendor_applications").update({
      status: decision,
      admin_notes: notes || null,
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", app.id);
    if (error) return toast.error(error.message);
    if (decision === "approved") {
      const { error: rErr } = await supabase.from("user_roles").insert({ user_id: app.user_id, role: "vendor" });
      if (rErr && !rErr.message.includes("duplicate")) toast.error(rErr.message);
    }
    await logAudit({
      actorId: user!.id, actorRole: "admin",
      action: `vendor_application.${decision}`,
      entityType: "vendor_application", entityId: app.id,
      metadata: { user_id: app.user_id, business_name: app.business_name, notes },
    });
    toast.success(`Application ${decision}`);
    qc.invalidateQueries({ queryKey: ["admin-vendor-apps"] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  if (loading || rolesLoading) return null;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl">Admins only</h1>
          <p className="text-muted-foreground mt-2">You don't have access to the admin panel.</p>
          <Link to="/" className="inline-block mt-6"><Button>Go home</Button></Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl">Admin panel</h1>
        <p className="text-muted-foreground mt-1">Manage products, orders, bookings and users.</p>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({apps.filter((a: any) => a.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="audit">Audit logs</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6 space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="p-4 rounded-2xl border bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">#{o.id.slice(0, 8)} · ₹{Number(o.total).toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{o.order_items?.length ?? 0} items · {o.shipping_city ?? "—"}</p>
                </div>
                <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            {orders.length === 0 && <p className="text-muted-foreground">No orders.</p>}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6 space-y-3">
            {bookings.map((b: any) => (
              <div key={b.id} className="p-4 rounded-2xl border bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{b.gardener_services?.title ?? "Service"} · ₹{Number(b.price).toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(b.scheduled_at).toLocaleString()}</p>
                  {b.address && <p className="text-xs text-muted-foreground mt-1">{b.address}</p>}
                </div>
                <Select value={b.status} onValueChange={(v) => updateBookingStatus(b.id, v)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-muted-foreground">No bookings.</p>}
          </TabsContent>

          <TabsContent value="products" className="mt-6 space-y-3">
            {products.map((p: any) => (
              <div key={p.id} className="p-4 rounded-2xl border bg-card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {p.image_url && <img src={p.image_url} className="h-12 w-12 rounded-lg object-cover" alt="" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">₹{Number(p.price).toFixed(0)} · stock {p.stock} · {p.is_active ? "active" : "hidden"}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => toggleProductActive(p.id, p.is_active)}>
                  {p.is_active ? "Hide" : "Show"}
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="users" className="mt-6 space-y-3">
            {users.map((u: any) => <UserRow key={u.id} u={u} onGrant={grantRole} onRevoke={revokeRole} />)}
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function UserRow({ u, onGrant, onRevoke }: { u: any; onGrant: (id: string, r: any) => void; onRevoke: (id: string, r: string) => void }) {
  const [role, setRole] = useState<"admin" | "vendor" | "gardener">("vendor");
  return (
    <div className="p-4 rounded-2xl border bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <p className="font-medium">{u.full_name || "(no name)"}</p>
        <p className="text-xs text-muted-foreground font-mono">{u.id}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {u.roles.map((r: string) => (
            <button key={r} onClick={() => onRevoke(u.id, r)} className="text-xs px-2 py-0.5 rounded-full bg-secondary hover:bg-destructive hover:text-destructive-foreground">
              {r} ×
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Select value={role} onValueChange={(v: any) => setRole(v)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">admin</SelectItem>
            <SelectItem value="vendor">vendor</SelectItem>
            <SelectItem value="gardener">gardener</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => onGrant(u.id, role)}>Grant</Button>
      </div>
    </div>
  );
}
