import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const placeOrder = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (items.length === 0) return;
    if (!address || !city || !phone) { toast.error("Fill shipping details"); return; }
    setSubmitting(true);
    const { data: order, error } = await supabase.from("orders").insert({
      customer_id: user.id, total, shipping_address: address, shipping_city: city, shipping_phone: phone, notes,
    }).select().single();
    if (error || !order) { setSubmitting(false); toast.error(error?.message ?? "Failed"); return; }
    const { error: itemsErr } = await supabase.from("order_items").insert(items.map((i) => ({
      order_id: order.id, product_id: i.id, quantity: i.quantity, unit_price: i.price, product_name: i.name,
    })));
    setSubmitting(false);
    if (itemsErr) { toast.error(itemsErr.message); return; }
    clear();
    toast.success("Order placed!");
    navigate({ to: "/dashboard" });
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl mb-8">Checkout</h1>
        {!user ? (
          <p className="text-muted-foreground">Please <a href="/auth" className="text-primary underline">sign in</a> to checkout.</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">Your cart is empty.</p>
        ) : (
          <div className="grid md:grid-cols-[1fr_360px] gap-10">
            <div className="space-y-4 max-w-xl">
              <h2 className="font-display text-xl">Shipping details</h2>
              <div><label className="text-sm font-medium">Address</label><Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">City</label><Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" /></div>
                <div><label className="text-sm font-medium">Phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
              </div>
              <div><label className="text-sm font-medium">Order notes</label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" /></div>
            </div>
            <aside className="p-6 rounded-2xl border bg-card h-fit">
              <h2 className="font-display text-xl mb-4">Order summary</h2>
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm py-1"><span>{i.name} × {i.quantity}</span><span>₹{(i.price * i.quantity).toFixed(0)}</span></div>
              ))}
              <div className="border-t my-4" />
              <div className="flex justify-between font-display text-lg"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
              <Button className="w-full mt-5 rounded-full" size="lg" onClick={placeOrder} disabled={submitting}>{submitting ? "Placing..." : "Place order"}</Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">Cash on delivery — payments coming soon</p>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
