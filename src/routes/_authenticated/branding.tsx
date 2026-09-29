import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Btn, Field, PageHeading } from "@/components/clinic-ui";
import { supabase } from "@/integrations/supabase/client";
import { brandingKey, defaultBranding, fileToDataUrl, useBranding, type Branding } from "@/lib/branding";
import { useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/branding")({
  head: () => ({ meta: [{ title: "تخصيص المظهر — Alteesh Clinic" }, { name: "description", content: "الألوان والشعار ونصوص العيادة." }] }),
  component: BrandingPage,
});

function BrandingPage() {
  const me = useMe();
  const b = useBranding();
  const qc = useQueryClient();
  const [f, setF] = useState<Branding>(b);
  const [msg, setMsg] = useState("");
  useEffect(() => { const { logo: _l, ...rest } = b; setF(rest); }, [b.clinic_name, b.logo_url, b.primary_color, b.accent_color, b.background_url, b.welcome_title, b.welcome_text, b.tagline]);
  if (me.data?.role !== "admin") return <p className="text-sm text-muted-foreground">هذه الصفحة للمدير فقط.</p>;

  const save = async (data: Branding) => {
    const { error } = await supabase.from("clinic_branding").update({ ...data, updated_at: new Date().toISOString() }).eq("id", 1);
    setMsg(error ? "تعذر الحفظ: " + error.message : "تم الحفظ");
    qc.invalidateQueries({ queryKey: brandingKey });
    setTimeout(() => setMsg(""), 2500);
  };
  const img = async (file: File | undefined, key: "logo_url" | "background_url", size: number) => { if (file) setF({ ...f, [key]: await fileToDataUrl(file, size) }); };
  const txt = (k: keyof Branding) => ({ className: "input-control", value: (f[k] as string) ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value }) });

  return (
    <>
      <PageHeading eyebrow="الإدارة" title="تخصيص المظهر" description="تظهر التغييرات لكل مستخدمي العيادة وفي صفحة الدخول." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 font-display text-base font-bold">الاسم والنصوص</h2>
          <div className="space-y-3">
            <Field label="اسم العيادة"><input {...txt("clinic_name")} /></Field>
            <Field label="الوصف المختصر"><input {...txt("tagline")} /></Field>
            <Field label="عنوان الترحيب"><input {...txt("welcome_title")} /></Field>
            <Field label="نص الترحيب"><input {...txt("welcome_text")} /></Field>
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="mb-4 font-display text-base font-bold">الألوان والصور</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="اللون الرئيسي"><input type="color" className="h-10 w-full cursor-pointer rounded-lg border border-border" value={f.primary_color} onChange={(e) => setF({ ...f, primary_color: e.target.value })} /></Field>
            <Field label="اللون الثانوي"><input type="color" className="h-10 w-full cursor-pointer rounded-lg border border-border" value={f.accent_color} onChange={(e) => setF({ ...f, accent_color: e.target.value })} /></Field>
          </div>
          <div className="mt-4 space-y-4">
            <Field label="الشعار">
              <div className="flex items-center gap-3">
                <img src={f.logo_url || b.logo} alt="" className="h-12 w-12 rounded-lg border border-border object-contain" />
                <input type="file" accept="image/*" className="text-xs" onChange={(e) => img(e.target.files?.[0], "logo_url", 256)} />
                {f.logo_url && <Btn variant="quiet" onClick={() => setF({ ...f, logo_url: null })}>إزالة</Btn>}
              </div>
            </Field>
            <Field label="صورة خلفية صفحة الدخول">
              <div className="flex items-center gap-3">
                {f.background_url ? <img src={f.background_url} alt="" className="h-12 w-20 rounded-lg object-cover" /> : <div className="h-12 w-20 rounded-lg bg-secondary" />}
                <input type="file" accept="image/*" className="text-xs" onChange={(e) => img(e.target.files?.[0], "background_url", 1600)} />
                {f.background_url && <Btn variant="quiet" onClick={() => setF({ ...f, background_url: null })}>إزالة</Btn>}
              </div>
            </Field>
          </div>
        </section>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Btn onClick={() => save(f)}>حفظ التغييرات</Btn>
        <Btn variant="outline" onClick={() => confirm("استعادة المظهر الافتراضي؟") && save(defaultBranding)}>استعادة الافتراضي</Btn>
        {msg && <span className="text-xs font-bold text-primary">{msg}</span>}
      </div>
    </>
  );
}
