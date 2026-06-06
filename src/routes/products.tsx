import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Shop Plants & Supplies — GreenNest" },
      { name: "description", content: "Browse indoor & outdoor plants, seeds, planters and gardening tools." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [search, setSearch] = useState("");
  const [env, setEnv] = useState<string | null>(null);
  const [catSlug, setCatSlug] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search, env, catSlug],
    queryFn: async () => {
      let q = supabase.from("products").select("*, categories(slug, name)").eq("is_active", true);
      if (search) q = q.ilike("name", `%${search}%`);
      if (env) q = q.eq("environment", env);
      const { data } = await q;
      const filtered = catSlug ? (data ?? []).filter((p: any) => p.categories?.slug === catSlug) : data ?? [];
      return filtered;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl">Shop the catalog</h1>
            <p className="text-muted-foreground mt-1">{products.length} items</p>
          </div>
          <Input placeholder="Search plants, tools..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:w-72" />
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-8">
          <aside className="space-y-6">
            <div>
              <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">Environment</h3>
              <div className="flex flex-wrap gap-2">
                {[null, "Indoor", "Outdoor"].map((e) => (
                  <Button key={e ?? "all"} size="sm" variant={env === e ? "default" : "outline"} className="rounded-full" onClick={() => setEnv(e)}>{e ?? "All"}</Button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">Category</h3>
              <div className="flex flex-col gap-1">
                <button className={`text-left text-sm py-1 ${!catSlug ? "text-primary font-medium" : "text-foreground/70"}`} onClick={() => setCatSlug(null)}>All categories</button>
                {categories.map((c: any) => (
                  <button key={c.id} className={`text-left text-sm py-1 ${catSlug === c.slug ? "text-primary font-medium" : "text-foreground/70 hover:text-foreground"}`} onClick={() => setCatSlug(c.slug)}>{c.name}</button>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : products.length === 0 ? (
              <p className="text-muted-foreground py-20 text-center">No products match your filters.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
