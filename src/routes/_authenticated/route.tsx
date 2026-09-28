import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/clinic-ui";
import { useMe } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Gate,
});

function Gate() {
  const me = useMe();
  const b = useBranding();
  if (me.isLoading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">جارٍ التحميل…</div>;
  if (!me.data?.role) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="panel max-w-md p-8 text-center">
          <img src={b.logo} alt="" className="mx-auto mb-4 h-14 object-contain" />
          <ShieldAlert className="mx-auto mb-3 text-accent" />
          <h1 className="font-display text-lg font-bold">حسابك بانتظار التفعيل</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">لم يمنحك مدير العيادة صلاحية بعد. تواصل معه ليضيفك كطبيب أو مدير.</p>
          <button className="mt-5 text-sm font-bold text-primary hover:underline" onClick={async () => { await supabase.auth.signOut(); location.href = "/auth"; }}>تسجيل الخروج</button>
        </div>
      </div>
    );
  }
  return <Shell><Outlet /></Shell>;
}
