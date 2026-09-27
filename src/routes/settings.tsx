import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RotateCcw, Stethoscope, Trash2 } from "lucide-react";
import { Btn, Field, PageHeading } from "@/components/clinic-ui";
import { fmtMoney, resetData, uid, update, useClinic, type Settings } from "@/lib/dental-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات والخدمات — Alteesh Clinic" },
      { name: "description", content: "إعدادات العيادة، الأطباء، وقائمة الخدمات والأسعار." },
      { property: "og:title", content: "الإعدادات والخدمات — Alteesh Clinic" },
      { property: "og:description", content: "إعدادات العيادة والأطباء والخدمات." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const d = useClinic();
  const [s, setS] = useState<Settings>(d.settings);
  const [doc, setDoc] = useState({ name: "", specialty: "" });
  const [svc, setSvc] = useState({ name: "", price: 0 });
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeading eyebrow="الإدارة" title="الإعدادات والخدمات" description="بيانات العيادة، الأطباء، وأسعار الخدمات." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 font-display text-base font-bold">بيانات العيادة</h2>
          <div className="form-grid">
            <Field label="اسم العيادة"><input className="input-control" value={s.clinicName} onChange={(e) => setS({ ...s, clinicName: e.target.value })} /></Field>
            <Field label="الفرع"><input className="input-control" value={s.branch} onChange={(e) => setS({ ...s, branch: e.target.value })} /></Field>
            <Field label="الهاتف"><input className="input-control" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
            <Field label="العملة"><input className="input-control" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} /></Field>
            <Field label="بداية الدوام"><input type="time" className="input-control" value={s.openAt} onChange={(e) => setS({ ...s, openAt: e.target.value })} /></Field>
            <Field label="نهاية الدوام"><input type="time" className="input-control" value={s.closeAt} onChange={(e) => setS({ ...s, closeAt: e.target.value })} /></Field>
          </div>
          <div className="mt-5 flex items-center gap-3"><Btn onClick={() => { update((x) => ({ ...x, settings: s })); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>حفظ</Btn>{saved && <span className="text-xs font-bold text-primary">تم الحفظ</span>}</div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-4 font-display text-base font-bold">الأطباء</h2>
          <div className="space-y-2">
            {d.doctors.map((x) => (
              <div key={x.id} className={`team-card flex items-center gap-3 !p-3 ${x.active ? "" : "team-inactive"}`}>
                <div className="stat-icon teal"><Stethoscope size={16} /></div>
                <div className="flex-1"><div className="text-sm font-bold">{x.name}</div><div className="text-xs text-muted-foreground">{x.specialty}</div></div>
                <Btn variant="quiet" onClick={() => update((st) => ({ ...st, doctors: st.doctors.map((y) => (y.id === x.id ? { ...y, active: !y.active } : y)) }))}>{x.active ? "إيقاف" : "تفعيل"}</Btn>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
            <input className="input-control" placeholder="اسم الطبيب" value={doc.name} onChange={(e) => setDoc({ ...doc, name: e.target.value })} />
            <input className="input-control" placeholder="الاختصاص" value={doc.specialty} onChange={(e) => setDoc({ ...doc, specialty: e.target.value })} />
            <Btn onClick={() => { if (!doc.name.trim()) return; update((st) => ({ ...st, doctors: [...st.doctors, { id: uid(), ...doc, active: true }] }), { type: "team", text: `انضم ${doc.name} إلى الفريق` }); setDoc({ name: "", specialty: "" }); }}><Plus size={15} /></Btn>
          </div>
        </section>

        <section className="panel p-5 xl:col-span-2">
          <h2 className="mb-4 font-display text-base font-bold">الخدمات والأسعار</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            {d.services.map((x) => (
              <div key={x.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="flex-1 font-bold">{x.name}</div>
                <input type="number" className="input-control w-36" value={x.price} onChange={(e) => update((st) => ({ ...st, services: st.services.map((y) => (y.id === x.id ? { ...y, price: Number(e.target.value) || 0 } : y)) }))} />
                <span className="w-28 text-xs text-muted-foreground">{fmtMoney(x.price, d.settings.currency)}</span>
                <button className="icon-btn" aria-label="حذف" onClick={() => update((st) => ({ ...st, services: st.services.filter((y) => y.id !== x.id) }))}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-[1fr_160px_auto] gap-2">
            <input className="input-control" placeholder="اسم الخدمة" value={svc.name} onChange={(e) => setSvc({ ...svc, name: e.target.value })} />
            <input type="number" className="input-control" placeholder="السعر" value={svc.price || ""} onChange={(e) => setSvc({ ...svc, price: Number(e.target.value) || 0 })} />
            <Btn onClick={() => { if (!svc.name.trim()) return; update((st) => ({ ...st, services: [...st.services, { id: uid(), ...svc }] })); setSvc({ name: "", price: 0 }); }}><Plus size={15} />إضافة</Btn>
          </div>
        </section>

        <section className="panel flex flex-wrap items-center justify-between gap-3 p-5 xl:col-span-2">
          <div><div className="font-display text-sm font-bold">إعادة البيانات التجريبية</div><div className="text-xs text-muted-foreground">يحذف كل ما أدخلته ويعيد الأمثلة الأولى.</div></div>
          <Btn variant="danger" onClick={() => confirm("هل أنت متأكد؟ سيتم حذف كل البيانات.") && resetData()}><RotateCcw size={15} />إعادة الضبط</Btn>
        </section>
      </div>
    </>
  );
}
