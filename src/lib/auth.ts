import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "doctor";
export const roleLabels: Record<Role, string> = { admin: "مدير", doctor: "طبيب" };

export type Me = { id: string; email: string; name: string; role: Role | null };

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me | null> => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      const list = (roles ?? []).map((r) => r.role as Role);
      const role: Role | null = list.includes("admin") ? "admin" : list.includes("doctor") ? "doctor" : null;
      return { id: user.id, email: user.email ?? "", name: profile?.full_name || user.email || "", role };
    },
  });
}
