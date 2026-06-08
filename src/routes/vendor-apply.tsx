import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/vendor-apply")({ component: VendorApply });

function VendorApply() {
  const { user, loading } = useAuth();
  const { isVendor, isAdmin } = useRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    business_name: "",
    description: "",
    contact_phone: "",
    contact_email: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data: apps = [] } = useQuery({
    queryKey: ["my-vendor-apps", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("vendor_applications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name) return toast.error("Business name is required");
    setSaving(true);
    const { data, error } = await supabase.from("vendor_applications").insert({
      ...form,
      user_id: user!.id,
    }).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted");
    await logAudit({
      actorId: user!.id,
      actorRole: "customer",
      action: "vendor_application.submitted",
      entityType: "vendor_application",
      entityId: data.id,
      metadata: { business_name: form.business_name },
    });
    setForm({ business_name: "", description: "", contact_phone: "", contact_email: "", address: "" });
    qc.invalidateQueries({ queryKey: ["my-vendor-apps"] });
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="font-display text-4xl">Become a vendor</h1>
        <p className="text-muted-foreground mt-1">Tell us about your nursery or gardening business. Admin will review your application.</p>

        {(isVendor || isAdmin) && (
          <div className="mt-6 p-4 rounded-2xl border bg-card">
            <p className="text-sm">You're already a vendor.</p>
            <Link to="/vendor"><Button size="sm" className="mt-2">Open vendor dashboard</Button></Link>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 p-6 rounded-2xl border bg-card space-y-3">
          <h2 className="font-display text-2xl">New application</h2>
          <Input placeholder="Business name *" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          <Textarea placeholder="Describe what you sell (plants, seeds, tools...)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Contact phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <Input placeholder="Contact email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <Textarea placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Submitting..." : "Submit application"}</Button>
        </form>

        <div className="mt-8 space-y-3">
          <h2 className="font-display text-2xl">Your applications</h2>
          {apps.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
          {apps.map((a: any) => (
            <div key={a.id} className="p-4 rounded-2xl border bg-card">
              <div className="flex items-center justify-between">
                <p className="font-medium">{a.business_name}</p>
                <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{a.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
              {a.admin_notes && <p className="text-sm mt-2"><span className="text-muted-foreground">Admin notes:</span> {a.admin_notes}</p>}
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
