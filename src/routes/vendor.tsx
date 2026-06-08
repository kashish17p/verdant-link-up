import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/vendor")({ component: VendorPanel });

const empty = {
  name: "",
  description: "",
  price: "",
  stock: "10",
  image_url: "",
  environment: "indoor",
  plant_type: "",
  care_instructions: "",
};

function VendorPanel() {
  const { user, loading } = useAuth();
  const { isVendor, isAdmin, isLoading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data: products = [] } = useQuery({
    queryKey: ["vendor-products", user?.id],
    enabled: !!user && (isVendor || isAdmin),
    queryFn: async () =>
      (await supabase.from("products").select("*").eq("vendor_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error("Name and price required");
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      image_url: form.image_url || null,
      environment: form.environment,
      plant_type: form.plant_type || null,
      care_instructions: form.care_instructions || null,
      vendor_id: user!.id,
      is_active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Product added");
    setForm(empty);
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  };

  const toggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  };

  if (loading || rolesLoading || !user) return null;

  if (!isVendor && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl">Become a vendor</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            You don't have vendor access yet. Ask an admin to grant you the vendor role to start listing plants and supplies.
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl">Vendor dashboard</h1>
        <p className="text-muted-foreground mt-1">List and manage your products.</p>

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <form onSubmit={submit} className="p-6 rounded-2xl border bg-card space-y-3">
            <h2 className="font-display text-2xl flex items-center gap-2"><Plus className="h-5 w-5" /> Add product</h2>
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Price ₹" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Type (plant/seed/tool)" value={form.plant_type} onChange={(e) => setForm({ ...form, plant_type: e.target.value })} />
            </div>
            <Textarea placeholder="Care instructions" value={form.care_instructions} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} />
            <Button type="submit" disabled={saving} className="w-full">{saving ? "Saving..." : "Add product"}</Button>
          </form>

          <div className="space-y-3">
            <h2 className="font-display text-2xl">Your listings ({products.length})</h2>
            {products.length === 0 && <p className="text-muted-foreground">No products yet.</p>}
            {products.map((p: any) => (
              <div key={p.id} className="p-4 rounded-2xl border bg-card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {p.image_url && <img src={p.image_url} className="h-14 w-14 rounded-lg object-cover" alt="" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">₹{Number(p.price).toFixed(0)} · stock {p.stock} · {p.is_active ? "live" : "hidden"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggle(p.id, p.is_active)}>{p.is_active ? "Hide" : "Show"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
