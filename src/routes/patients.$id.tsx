import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CircleAlert, ClipboardList, Pencil, Pill, Plus, Trash2 } from "lucide-react";
import { Badge, Btn, EmptyState, Field, Modal, PageHeading, statusTone } from "@/components/clinic-ui";
import { PatientForm } from "@/components/patient-form";
import { age, conditionLabels, fmtMoney, invoicePaid, invoiceTotal, shortDate, statusLabels, todayISO, uid, update, useClinic, type ToothCondition } from "@/lib/dental-store";

export const Route = createFileRoute("/patients/$id")({
  head: () => ({
    meta: [
      { title: "ملف المريض — Alteesh Clinic" },
      { name: "description", content: "ملف المريض: مخطط الأسنان، العلاجات، الوصفات والفواتير." },
      { property: "og:title", content: "ملف المريض — Alteesh Clinic" },
      { property: "og:description", content: "ملف المريض ومخطط الأسنان." },
    ],
  }),
  component: PatientPage,
});

const upper = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lower = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const condColor: Record<ToothCondition, string> = {
  healthy: "bg-card text-foreground", caries: "bg-destructive/15 text-destructive", filled: "bg-primary/15 text-primary", crown: "bg-accent/30 text-accent-foreground",
  root: "bg-chart-3/20 text-chart-3", missing: "bg-muted text-muted-foreground line-through", implant: "bg-chart-4/25 text-foreground",
};
const tabs = ["مخطط الأسنان", "العلاجات", "الوصفات", "المواعيد", "الفواتير"] as const;

function PatientPage() {
  const { id } = Route.useParams();
  const d = useClinic();
  const nav = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>("مخطط الأسنان");
  const [editing, setEditing] = useState(false);
  const p = d.patients.find((x) => x.id === id);
  if (!p) return <EmptyState icon={CircleAlert} title="المريض غير موجود" text="ربما تم حذف هذا الملف." />;
  const a = age(p.birthDate);
  const remove = () => {
    if (!confirm(`حذف ملف ${p.name} نهائياً؟`)) return;
    update((s) => ({ ...s, patients: s.patients.filter((x) => x.id !== id), appointments: s.appointments.filter((x) => x.patientId !== id) }), { type: "patient", text: `تم حذف ملف ${p.name}` });
    nav({ to: "/patients" });
  };

  return (
    <>
      <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowRight size={14} />كل المرضى</Link>
      <PageHeading eyebrow="ملف المريض" title={p.name} description={[p.gender, a !== null ? `${a} سنة` : null, p.phone, p.address].filter(Boolean).join(" · ")}
        action={<div className="flex gap-2"><Btn variant="outline" onClick={() => setEditing(true)}><Pencil size={15} />تعديل</Btn><Btn variant="danger" onClick={remove}><Trash2 size={15} />حذف</Btn></div>} />
      {(p.allergies || p.chronic || p.notes) && (
        <div className="mb-5 flex flex-wrap gap-3">
          {p.allergies && <div className="panel flex items-center gap-2 px-4 py-3 text-sm"><CircleAlert size={16} className="text-destructive" /><b>حساسية:</b> {p.allergies}</div>}
          {p.chronic && <div className="panel px-4 py-3 text-sm"><b>أمراض مزمنة:</b> {p.chronic}</div>}
          {p.notes && <div className="panel px-4 py-3 text-sm text-muted-foreground">{p.notes}</div>}
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? "tab-active" : ""}`}>{t}</button>)}
      </div>
      {tab === "مخطط الأسنان" && <DentalChart patientId={id} />}
      {tab === "العلاجات" && <Treatments patientId={id} />}
      {tab === "الوصفات" && <Prescriptions patientId={id} />}
      {tab === "المواعيد" && (
        <section className="panel divide-y divide-border">
          {d.appointments.filter((x) => x.patientId === id).sort((x, y) => y.date.localeCompare(x.date)).map((x) => (
            <div key={x.id} className="flex items-center gap-4 px-5 py-3.5 text-sm"><div className="w-28 text-muted-foreground">{shortDate(x.date)} · {x.time}</div><div className="flex-1">{x.reason || "—"}<span className="text-xs text-muted-foreground"> · {d.doctors.find((dd) => dd.id === x.doctorId)?.name}</span></div><Badge tone={statusTone[x.status]}>{statusLabels[x.status]}</Badge></div>
          ))}
          {!d.appointments.some((x) => x.patientId === id) && <EmptyState icon={ClipboardList} title="لا توجد مواعيد" text="احجز موعداً من صفحة المواعيد." />}
        </section>
      )}
      {tab === "الفواتير" && (
        <section className="panel divide-y divide-border">
          {d.invoices.filter((i) => i.patientId === id).map((i) => { const due = invoiceTotal(i) - invoicePaid(i); return (
            <div key={i.id} className="flex items-center gap-4 px-5 py-3.5 text-sm"><div className="w-20 font-mono text-xs">#{i.number}</div><div className="flex-1 text-muted-foreground">{shortDate(i.date)} · {i.items.map((x) => x.name).join("، ")}</div><div className="font-bold">{fmtMoney(invoiceTotal(i), d.settings.currency)}</div>{due > 0 ? <Badge tone="coral">متبقي {fmtMoney(due, d.settings.currency)}</Badge> : <Badge tone="teal">مسددة</Badge>}</div>
          ); })}
          {!d.invoices.some((i) => i.patientId === id) && <EmptyState icon={ClipboardList} title="لا توجد فواتير" text="أنشئ فاتورة من صفحة الفواتير." />}
        </section>
      )}
      {editing && <PatientForm initial={p} onClose={() => setEditing(false)} />}
    </>
  );
}

function DentalChart({ patientId }: { patientId: string }) {
  const d = useClinic();
  const records = d.teeth[patientId] ?? [];
  const [sel, setSel] = useState<number | null>(null);
  const rec = (n: number) => records.find((r) => r.tooth === n);
  const Tooth = ({ n }: { n: number }) => {
    const c = rec(n)?.condition ?? "healthy";
    return <button onClick={() => setSel(n)} title={conditionLabels[c]} className={`flex h-11 w-full min-w-7 flex-col items-center justify-center rounded-md border border-border text-[11px] font-bold transition hover:border-primary ${condColor[c]} ${sel === n ? "ring-2 ring-primary" : ""}`}>{n}</button>;
  };
  const current = sel ? rec(sel) : undefined;
  const save = (condition: ToothCondition, note: string) => {
    if (!sel) return;
    update((s) => {
      const list = (s.teeth[patientId] ?? []).filter((r) => r.tooth !== sel);
      return { ...s, teeth: { ...s.teeth, [patientId]: condition === "healthy" && !note ? list : [...list, { tooth: sel, condition, note }] } };
    });
    setSel(null);
  };
  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-base font-bold">مخطط الأسنان</h2><p className="mt-1 text-xs text-muted-foreground">اضغط على السن لتحديد حالته (ترقيم FDI)</p></div>
        <div className="flex flex-wrap gap-2">{(Object.keys(conditionLabels) as ToothCondition[]).map((c) => <span key={c} className={`rounded-md border border-border px-2 py-0.5 text-[11px] ${condColor[c]}`}>{conditionLabels[c]}</span>)}</div></div>
      <div className="overflow-x-auto" dir="ltr">
        <div className="min-w-[560px] space-y-2">
          <div className="text-center text-[10px] font-bold tracking-widest text-muted-foreground">الفك العلوي</div>
          <div className="grid grid-cols-16 gap-1" style={{ gridTemplateColumns: "repeat(16,minmax(0,1fr))" }}>{upper.map((n) => <Tooth key={n} n={n} />)}</div>
          <div className="border-t border-dashed border-border" />
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(16,minmax(0,1fr))" }}>{lower.map((n) => <Tooth key={n} n={n} />)}</div>
          <div className="text-center text-[10px] font-bold tracking-widest text-muted-foreground">الفك السفلي</div>
        </div>
      </div>
      {records.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{records.map((r) => <Badge key={r.tooth} tone="neutral">سن {r.tooth}: {conditionLabels[r.condition]}{r.note ? ` — ${r.note}` : ""}</Badge>)}</div>}
      {sel && <ToothModal tooth={sel} initial={current} onClose={() => setSel(null)} onSave={save} />}
    </section>
  );
}

function ToothModal({ tooth, initial, onClose, onSave }: { tooth: number; initial?: { condition: ToothCondition; note: string } | undefined; onClose: () => void; onSave: (c: ToothCondition, n: string) => void }) {
  const [c, setC] = useState<ToothCondition>(initial?.condition ?? "healthy");
  const [note, setNote] = useState(initial?.note ?? "");
  return (
    <Modal small title={`السن رقم ${tooth}`} onClose={onClose}>
      <div className="mb-4 flex flex-wrap gap-2">{(Object.keys(conditionLabels) as ToothCondition[]).map((k) => <button key={k} onClick={() => setC(k)} className={`status-choice ${c === k ? "status-choice-active" : ""}`}>{conditionLabels[k]}</button>)}</div>
      <Field label="ملاحظة"><input className="input-control" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <div className="mt-5 flex gap-2"><Btn onClick={() => onSave(c, note)}>حفظ</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></div>
    </Modal>
  );
}

function Treatments({ patientId }: { patientId: string }) {
  const d = useClinic();
  const [open, setOpen] = useState(false);
  const list = d.treatments.filter((t) => t.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
  const [f, setF] = useState({ serviceId: d.services[0]?.id ?? "", doctorId: d.doctors[0]?.id ?? "", tooth: "", date: todayISO(), notes: "", bill: true });
  const add = () => {
    const svc = d.services.find((s) => s.id === f.serviceId);
    if (!svc) return;
    const pname = d.patients.find((p) => p.id === patientId)?.name;
    update((s) => {
      const next = { ...s, treatments: [...s.treatments, { id: uid(), patientId, doctorId: f.doctorId, serviceId: f.serviceId, tooth: f.tooth, date: f.date, notes: f.notes, price: svc.price }] };
      if (!f.bill) return next;
      const number = Math.max(1000, ...s.invoices.map((i) => i.number)) + 1;
      return { ...next, invoices: [...s.invoices, { id: uid(), number, patientId, date: f.date, items: [{ name: svc.name + (f.tooth ? ` (سن ${f.tooth})` : ""), qty: 1, price: svc.price }], payments: [], discount: 0 }] };
    }, { type: "patient", text: `تسجيل علاج "${svc.name}" لـ ${pname}` });
    setOpen(false);
  };
  return (
    <section className="panel">
      <div className="panel-heading"><h2 className="font-display text-base font-bold">العلاجات المنفذة</h2><Btn onClick={() => setOpen(true)}><Plus size={15} />علاج جديد</Btn></div>
      <div className="divide-y divide-border">
        {list.map((t) => (
          <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
            <div className="w-20 text-xs text-muted-foreground">{shortDate(t.date)}</div>
            <div className="flex-1"><b>{d.services.find((s) => s.id === t.serviceId)?.name ?? "خدمة"}</b>{t.tooth && <span className="text-muted-foreground"> · سن {t.tooth}</span>}<div className="text-xs text-muted-foreground">{d.doctors.find((x) => x.id === t.doctorId)?.name}{t.notes ? ` · ${t.notes}` : ""}</div></div>
            <div className="font-bold">{fmtMoney(t.price, d.settings.currency)}</div>
            <button className="text-muted-foreground hover:text-destructive" aria-label="حذف" onClick={() => update((s) => ({ ...s, treatments: s.treatments.filter((x) => x.id !== t.id) }))}><Trash2 size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <EmptyState icon={ClipboardList} title="لا توجد علاجات" text="سجّل أول علاج لهذا المريض." />}
      </div>
      {open && (
        <Modal title="علاج جديد" onClose={() => setOpen(false)}>
          <div className="form-grid">
            <Field label="الخدمة"><select className="input-control" value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}>{d.services.map((s) => <option key={s.id} value={s.id}>{s.name} — {fmtMoney(s.price, d.settings.currency)}</option>)}</select></Field>
            <Field label="الطبيب"><select className="input-control" value={f.doctorId} onChange={(e) => setF({ ...f, doctorId: e.target.value })}>{d.doctors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
            <Field label="رقم السن (اختياري)"><input className="input-control" value={f.tooth} onChange={(e) => setF({ ...f, tooth: e.target.value })} placeholder="مثال: 16" /></Field>
            <Field label="التاريخ"><input type="date" className="input-control" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="ملاحظات" full><input className="input-control" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.bill} onChange={(e) => setF({ ...f, bill: e.target.checked })} />إنشاء فاتورة لهذا العلاج تلقائياً</label>
          </div>
          <div className="mt-6 flex gap-2"><Btn onClick={add}>حفظ</Btn><Btn variant="outline" onClick={() => setOpen(false)}>إلغاء</Btn></div>
        </Modal>
      )}
    </section>
  );
}

function Prescriptions({ patientId }: { patientId: string }) {
  const d = useClinic();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ drug: "", dosage: "", duration: "", doctorId: d.doctors[0]?.id ?? "" });
  const list = d.prescriptions.filter((r) => r.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
  const add = () => {
    if (!f.drug.trim()) return;
    update((s) => ({ ...s, prescriptions: [...s.prescriptions, { id: uid(), patientId, date: todayISO(), ...f }] }));
    setF({ ...f, drug: "", dosage: "", duration: "" });
    setOpen(false);
  };
  return (
    <section className="panel">
      <div className="panel-heading"><h2 className="font-display text-base font-bold">الوصفات الطبية</h2><Btn onClick={() => setOpen(true)}><Plus size={15} />وصفة جديدة</Btn></div>
      <div className="divide-y divide-border">
        {list.map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
            <div className="stat-icon teal"><Pill size={16} /></div>
            <div className="flex-1"><b>{r.drug}</b><div className="text-xs text-muted-foreground">{r.dosage} · {r.duration} · {d.doctors.find((x) => x.id === r.doctorId)?.name}</div></div>
            <div className="text-xs text-muted-foreground">{shortDate(r.date)}</div>
            <button className="text-muted-foreground hover:text-destructive" aria-label="حذف" onClick={() => update((s) => ({ ...s, prescriptions: s.prescriptions.filter((x) => x.id !== r.id) }))}><Trash2 size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <EmptyState icon={Pill} title="لا توجد وصفات" text="أضف وصفة دوائية للمريض." />}
      </div>
      {open && (
        <Modal small title="وصفة جديدة" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="الدواء"><input className="input-control" value={f.drug} onChange={(e) => setF({ ...f, drug: e.target.value })} /></Field>
            <Field label="الجرعة"><input className="input-control" value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} placeholder="حبة كل 8 ساعات" /></Field>
            <Field label="المدة"><input className="input-control" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} placeholder="5 أيام" /></Field>
            <Field label="الطبيب"><select className="input-control" value={f.doctorId} onChange={(e) => setF({ ...f, doctorId: e.target.value })}>{d.doctors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
          </div>
          <div className="mt-6 flex gap-2"><Btn onClick={add}>حفظ</Btn><Btn variant="outline" onClick={() => setOpen(false)}>إلغاء</Btn></div>
        </Modal>
      )}
    </section>
  );
}
