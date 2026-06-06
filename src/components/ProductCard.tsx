import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: any }) {
  const { add } = useCart();
  return (
    <div className="group rounded-2xl bg-card border overflow-hidden hover:shadow-lg transition">
      <Link to="/products/$id" params={{ id: product.id }} className="block">
        <div className="aspect-square bg-muted overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          ) : <div className="w-full h-full" />}
        </div>
      </Link>
      <div className="p-4">
        <Link to="/products/$id" params={{ id: product.id }}>
          <h3 className="font-medium line-clamp-1">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-display text-lg">₹{Number(product.price).toFixed(0)}</span>
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => {
            add({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url });
            toast.success("Added to cart");
          }}>Add</Button>
        </div>
      </div>
    </div>
  );
}
