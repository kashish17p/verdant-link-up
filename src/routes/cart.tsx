import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, total, setQty, remove } = useCart();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl mb-8">Your cart</h1>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Link to="/products"><Button className="rounded-full">Browse plants</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_360px] gap-10">
            <div className="space-y-4">
              {items.map((i) => (
                <div key={i.id} className="flex gap-4 p-4 border rounded-2xl bg-card">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {i.image_url && <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{i.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">₹{i.price.toFixed(0)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.id, i.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{i.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.id, i.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg">₹{(i.price * i.quantity).toFixed(0)}</p>
                    <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <aside className="p-6 rounded-2xl border bg-card h-fit">
              <h2 className="font-display text-xl mb-4">Summary</h2>
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{total.toFixed(0)}</span></div>
              <div className="flex justify-between text-sm mt-2 text-muted-foreground"><span>Shipping</span><span>Calculated at checkout</span></div>
              <div className="border-t my-4" />
              <div className="flex justify-between font-display text-lg"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
              <Link to="/checkout"><Button className="w-full mt-5 rounded-full" size="lg">Checkout</Button></Link>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
