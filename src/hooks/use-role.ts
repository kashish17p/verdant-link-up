import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useRoles() {
  const { user } = useAuth();
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.role as string);
    },
  });
  return {
    roles,
    isLoading,
    isAdmin: roles.includes("admin"),
    isVendor: roles.includes("vendor"),
  };
}
