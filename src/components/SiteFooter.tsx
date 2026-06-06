import { Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t mt-20">
      <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-display text-lg">GreenNest</span>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} GreenNest. Grow with us.</p>
      </div>
    </footer>
  );
}
