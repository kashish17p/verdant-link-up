import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Leaf, ShieldCheck, Sprout, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import heroImg from "@/assets/hero-plants.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GreenNest — Plants, supplies & verified gardeners" },
      { name: "description", content: "Shop indoor & outdoor plants, gardening tools and book verified gardeners for home care, all in one place." },
      { property: "og:title", content: "GreenNest — Online Nursery & Gardening Services" },
      { property: "og:description", content: "Plants, supplies and verified gardeners delivered to your home." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: featured = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).limit(4);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                <Sprout className="h-3.5 w-3.5" /> Fresh from the nursery
              </span>
              <h1 className="mt-5 font-display text-5xl md:text-6xl font-semibold leading-[1.05]">
                Grow a greener<br /> home, effortlessly.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-md">
                Shop curated plants, tools & planters — and book verified gardeners for care that keeps everything thriving.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/products"><Button size="lg" className="rounded-full">Shop plants <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
                <Link to="/services"><Button size="lg" variant="outline" className="rounded-full">Book a gardener</Button></Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { icon: Truck, label: "Safe delivery" },
                  { icon: ShieldCheck, label: "Verified pros" },
                  { icon: Leaf, label: "Care guidance" },
                ].map((f) => (
                  <div key={f.label} className="text-center">
                    <f.icon className="h-5 w-5 mx-auto text-primary" />
                    <p className="text-xs mt-1 text-muted-foreground">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-accent/30 rounded-[2rem] blur-2xl" />
              <img src={heroImg} alt="Lush green indoor plants" width={1600} height={1000} className="relative rounded-3xl shadow-2xl object-cover aspect-[4/5] md:aspect-[5/6]" />
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Featured this week</h2>
              <p className="text-muted-foreground mt-1">Hand-picked for new plant parents.</p>
            </div>
            <Link to="/products" className="text-sm font-medium text-primary hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {featured.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Services CTA */}
        <section className="container mx-auto px-4 pb-16">
          <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-14 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Need a hand in the garden?</h2>
              <p className="mt-3 opacity-90 max-w-md">Book verified gardeners for planting, pruning, lawn care and seasonal maintenance.</p>
            </div>
            <div className="md:justify-self-end">
              <Link to="/services"><Button size="lg" variant="secondary" className="rounded-full">Explore services <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
