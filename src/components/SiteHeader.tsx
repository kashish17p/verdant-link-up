import { Link, useNavigate } from "@tanstack/react-router";
import { Leaf, ShoppingCart, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { count } = useCart();
  const { user } = useAuth();
  const { isAdmin, isVendor } = useRoles();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-background/80 border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold">GreenNest</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link to="/products" className="text-foreground/80 hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Shop Plants</Link>
          <Link to="/services" className="text-foreground/80 hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Gardeners</Link>
          {user && <Link to="/dashboard" className="text-foreground/80 hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Dashboard</Link>}
          {(isVendor || isAdmin) && <Link to="/vendor" className="text-foreground/80 hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Vendor</Link>}
          {user && !isVendor && !isAdmin && <Link to="/vendor-apply" className="text-foreground/80 hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Sell with us</Link>}
          {isAdmin && <Link to="/admin" className="text-foreground/80 hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>Admin</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">{count}</span>
              )}
            </Button>
          </Link>
          {user ? (
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="h-5 w-5" /></Button>
          ) : (
            <Link to="/auth"><Button variant="default" size="sm"><UserIcon className="h-4 w-4 mr-1" /> Sign in</Button></Link>
          )}
        </div>
      </div>
    </header>
  );
}
