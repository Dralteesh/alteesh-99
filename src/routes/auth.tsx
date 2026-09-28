import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useBranding } from "@/lib/branding";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Alteesh Clinic" },
      { name: "description", content: "تسجيل دخول فريق العيادة إلى نظام إدارة عيادة الأسنان." },
      { property: "og:title", content: "تسجيل الدخول — Alteesh Clinic" },
      { property: "og:description", content: "دخول الأطباء ومدير العيادة إلى النظام." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const b = useBranding();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ text: "البريد أو كلمة المرور غير صحيحة" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
      setMsg(error ? { text: error.message } : { ok: true, text: "تم إنشاء الحساب. افتح بريدك لتأكيده ثم سجّل الدخول." });
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg({ text: "تعذر الدخول بحساب Google" });
  }

  return (
    <div dir="rtl" className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        {b.background_url && <img src={b.background_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
        <div className="absolute bottom-12 right-12 left-12 text-primary-foreground">
          <h2 className="font-display text-3xl font-bold leading-snug">{b.clinic_name}</h2>
          <p className="mt-3 max-w-md text-sm leading-7 opacity-90">{b.tagline}</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <img src={b.logo} alt={b.clinic_name} className="mb-6 h-16 object-contain" />
          <h1 className="font-display text-2xl font-bold">{mode === "in" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{mode === "in" ? "أهلاً بعودتك إلى العيادة." : "أول حساب يُنشأ يصبح مدير العيادة، والبقية بانتظار موافقة المدير."}</p>
          <button onClick={google} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-bold hover:bg-secondary">
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
            المتابعة بحساب Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />أو<div className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && <input className="input-control" placeholder="الاسم الكامل" required value={name} onChange={(e) => setName(e.target.value)} />}
            <input className="input-control" type="email" dir="ltr" placeholder="email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input-control" type="password" dir="ltr" placeholder="كلمة المرور" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            {msg && <p className={`text-xs ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>}
            <button disabled={busy} className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:brightness-95 disabled:opacity-50">{mode === "in" ? "دخول" : "إنشاء الحساب"}</button>
          </form>
          <button className="mt-5 text-xs font-bold text-primary hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
            {mode === "in" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}
          </button>
        </div>
      </div>
    </div>
  );
}
