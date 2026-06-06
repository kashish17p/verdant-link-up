import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { add } = useCart();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await supabase.from("products").select("*, categories(name)").eq("id", id).maybeSingle()).data,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4 mr-1" /> Back to shop</Link>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : !product ? <p>Not found.</p> : (
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted">
              {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
            </div>
            <div>
              {product.categories && <span className="text-sm text-muted-foreground">{(product as any).categories.name}</span>}
              <h1 className="font-display text-4xl mt-2">{product.name}</h1>
              <p className="font-display text-3xl mt-4">₹{Number(product.price).toFixed(0)}</p>
              <p className="mt-5 text-foreground/80 leading-relaxed">{product.description}</p>
              {product.care_instructions && (
                <div className="mt-6 p-5 rounded-2xl bg-secondary">
                  <h3 className="font-medium mb-1">Care instructions</h3>
                  <p className="text-sm text-secondary-foreground/80">{product.care_instructions}</p>
                </div>
              )}
              <div className="mt-8 flex gap-3">
                <Button size="lg" className="rounded-full" onClick={() => {
                  add({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url });
                  toast.success("Added to cart");
                }}>Add to cart</Button>
                <Link to="/cart"><Button size="lg" variant="outline" className="rounded-full">View cart</Button></Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{product.stock} in stock</p>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
