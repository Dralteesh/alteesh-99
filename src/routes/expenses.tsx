import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Badge, Btn, EmptyState, Field, Modal, PageHeading, StatCard } from "@/components/clinic-ui";
import { fmtMoney, shortDate, todayISO, uid, update, useClinic } from "@/lib/dental-store";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "المصاريف — Alteesh Clinic" },
      { name: "description", content: "تسجيل مصاريف العيادة ومقارنتها بالإيرادات الشهرية." },
      { property: "og:title", content: "المصاريف — Alteesh Clinic" },
      { property: "og:description", content: "مصاريف العيادة الشهرية." },
    ],
  }),
  component: Expenses,
});

const categories = ["مواد طبية", "رواتب", "إيجار", "فواتير خدمات", "صيانة", "أخرى"];

function Expenses() {
  const d = useClinic();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ date: todayISO(), category: categories[0], description: "", amount: 0 });
  const cur = d.settings.currency;
  const month = todayISO().slice(0, 7);
  const monthExp = d.expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);
  const monthInc = d.invoices.flatMap((i) => i.payments).filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.amount, 0);
  const list = [...d.expenses].sort((a, b) => b.date.localeCompare(a.date));
  const save = () => {
    if (!f.amount) return;
    update((s) => ({ ...s, expenses: [...s.expenses, { id: uid(), ...f }] }), { type: "system", text: `مصروف جديد: ${f.category}` });
    setF({ ...f, description: "", amount: 0 });
    setOpen(false);
  };
  return (
    <>
      <PageHeading eyebrow="المالية" title="المصاريف" description="سجّل مصاريف العيادة لتعرف صافي الربح." action={<Btn onClick={() => setOpen(true)}><Plus size={16} />مصروف جديد</Btn>} />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="مصاريف الشهر" value={fmtMoney(monthExp, cur)} note="الشهر الحالي" icon={Wallet} color="coral" />
        <StatCard label="إيرادات الشهر" value={fmtMoney(monthInc, cur)} note="الدفعات المحصلة" icon={Wallet} color="teal" />
        <StatCard label="صافي الشهر" value={fmtMoney(monthInc - monthExp, cur)} note="الإيرادات ناقص المصاريف" icon={Wallet} color="sand" />
      </div>
      <section className="panel divide-y divide-border">
        {list.map((e) => (
          <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
            <div className="w-20 text-xs text-muted-foreground">{shortDate(e.date)}</div>
            <Badge tone="blue">{e.category}</Badge>
            <div className="flex-1 text-muted-foreground">{e.description || "—"}</div>
            <div className="font-bold">{fmtMoney(e.amount, cur)}</div>
            <button className="icon-btn" aria-label="حذف" onClick={() => update((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== e.id) }))}><Trash2 size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <EmptyState icon={Wallet} title="لا توجد مصاريف" text="سجّل أول مصروف للعيادة." />}
      </section>
      {open && (
        <Modal small title="مصروف جديد" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="التاريخ"><input type="date" className="input-control" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="الفئة"><select className="input-control" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="الوصف"><input className="input-control" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <Field label="المبلغ"><input type="number" className="input-control" value={f.amount} onChange={(e) => setF({ ...f, amount: Number(e.target.value) || 0 })} /></Field>
          </div>
          <div className="mt-6 flex gap-2"><Btn onClick={save}>حفظ</Btn><Btn variant="outline" onClick={() => setOpen(false)}>إلغاء</Btn></div>
        </Modal>
      )}
    </>
  );
}
