import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Receipt, Trash2, Wallet } from "lucide-react";
import { Badge, Btn, EmptyState, Field, Modal, PageHeading, StatCard } from "@/components/clinic-ui";
import { fmtMoney, invoicePaid, invoiceTotal, shortDate, todayISO, uid, update, useClinic, type Invoice, type InvoiceItem } from "@/lib/dental-store";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({
    meta: [
      { title: "الفواتير والدفعات — Alteesh Clinic" },
      { name: "description", content: "إنشاء فواتير المرضى وتسجيل الدفعات ومتابعة المبالغ المتبقية." },
      { property: "og:title", content: "الفواتير والدفعات — Alteesh Clinic" },
      { property: "og:description", content: "فواتير المرضى والدفعات." },
    ],
  }),
  component: Invoices,
});

function Invoices() {
  const d = useClinic();
  const [filter, setFilter] = useState<"all" | "due" | "paid">("all");
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const cur = d.settings.currency;
  const total = d.invoices.reduce((s, i) => s + invoiceTotal(i), 0);
  const paid = d.invoices.reduce((s, i) => s + invoicePaid(i), 0);
  const list = [...d.invoices].sort((a, b) => b.number - a.number).filter((i) => { const due = invoiceTotal(i) - invoicePaid(i); return filter === "all" || (filter === "due" ? due > 0 : due <= 0); });
  const pname = (id: string) => d.patients.find((p) => p.id === id)?.name ?? "—";

  return (
    <>
      <PageHeading eyebrow="المالية" title="الفواتير والدفعات" description="تابع ما تم تحصيله وما بقي على المرضى." action={<Btn onClick={() => setCreating(true)}><Plus size={16} />فاتورة جديدة</Btn>} />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي الفواتير" value={fmtMoney(total, cur)} note={`${d.invoices.length} فاتورة`} icon={Receipt} color="teal" />
        <StatCard label="المحصّل" value={fmtMoney(paid, cur)} note="مجموع الدفعات" icon={Wallet} color="blue" />
        <StatCard label="المتبقي" value={fmtMoney(total - paid, cur)} note="ديون على المرضى" icon={Receipt} color="coral" />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div className="flex gap-1">{([["all", "الكل"], ["due", "غير مسددة"], ["paid", "مسددة"]] as const).map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`tab-btn ${filter === k ? "tab-active" : ""}`}>{l}</button>)}</div>
        </div>
        <div className="divide-y divide-border">
          {list.map((i) => { const t = invoiceTotal(i); const due = t - invoicePaid(i); return (
            <div key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 text-sm">
              <div className="w-16 font-mono text-xs text-muted-foreground">#{i.number}</div>
              <div className="min-w-40 flex-1"><Link to="/patients/$id" params={{ id: i.patientId }} className="font-bold hover:text-primary">{pname(i.patientId)}</Link><div className="text-xs text-muted-foreground">{shortDate(i.date)} · {i.items.map((x) => x.name).join("، ")}</div></div>
              <div className="font-bold">{fmtMoney(t, cur)}</div>
              {due > 0 ? <Badge tone="coral">متبقي {fmtMoney(due, cur)}</Badge> : <Badge tone="teal">مسددة</Badge>}
              <div className="flex gap-1">
                {due > 0 && <Btn variant="quiet" onClick={() => setPaying(i)}>تسجيل دفعة</Btn>}
                <button className="icon-btn" aria-label="حذف" onClick={() => confirm("حذف الفاتورة؟") && update((s) => ({ ...s, invoices: s.invoices.filter((x) => x.id !== i.id) }))}><Trash2 size={15} /></button>
              </div>
            </div>
          ); })}
          {list.length === 0 && <EmptyState icon={Receipt} title="لا توجد فواتير" text="أنشئ فاتورة جديدة لمريض." />}
        </div>
      </section>
      {creating && <NewInvoice onClose={() => setCreating(false)} />}
      {paying && <PayModal invoice={paying} onClose={() => setPaying(null)} />}
    </>
  );
}

function NewInvoice({ onClose }: { onClose: () => void }) {
  const d = useClinic();
  const [patientId, setPatientId] = useState(d.patients[0]?.id ?? "");
  const [date, setDate] = useState(todayISO());
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([{ name: d.services[0]?.name ?? "", qty: 1, price: d.services[0]?.price ?? 0 }]);
  const setItem = (idx: number, patch: Partial<InvoiceItem>) => setItems(items.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const sum = items.reduce((s, x) => s + x.qty * x.price, 0) - discount;
  const save = () => {
    if (!patientId || items.length === 0) return;
    const pn = d.patients.find((p) => p.id === patientId)?.name;
    update((s) => ({ ...s, invoices: [...s.invoices, { id: uid(), number: Math.max(1000, ...s.invoices.map((i) => i.number)) + 1, patientId, date, items, payments: [], discount }] }), { type: "system", text: `فاتورة جديدة لـ ${pn}` });
    onClose();
  };
  return (
    <Modal title="فاتورة جديدة" onClose={onClose}>
      <div className="form-grid">
        <Field label="المريض"><select className="input-control" value={patientId} onChange={(e) => setPatientId(e.target.value)}>{d.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="التاريخ"><input type="date" className="input-control" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <div className="mt-5 space-y-2">
        <div className="text-xs font-bold text-muted-foreground">البنود</div>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_60px_110px_32px] gap-2">
            <select className="input-control" value={it.name} onChange={(e) => { const s = d.services.find((x) => x.name === e.target.value); setItem(idx, { name: e.target.value, price: s?.price ?? it.price }); }}>{d.services.map((s) => <option key={s.id}>{s.name}</option>)}</select>
            <input type="number" min={1} className="input-control" value={it.qty} onChange={(e) => setItem(idx, { qty: Number(e.target.value) || 1 })} />
            <input type="number" className="input-control" value={it.price} onChange={(e) => setItem(idx, { price: Number(e.target.value) || 0 })} />
            <button className="icon-btn" aria-label="حذف البند" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 size={14} /></button>
          </div>
        ))}
        <Btn variant="quiet" onClick={() => setItems([...items, { name: d.services[0]?.name ?? "", qty: 1, price: d.services[0]?.price ?? 0 }])}><Plus size={14} />إضافة بند</Btn>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <Field label="حسم"><input type="number" className="input-control w-36" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} /></Field>
        <div className="text-left"><div className="text-xs text-muted-foreground">الإجمالي</div><div className="font-display text-xl font-bold text-primary">{fmtMoney(sum, d.settings.currency)}</div></div>
      </div>
      <div className="mt-6 flex gap-2"><Btn onClick={save}>حفظ الفاتورة</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></div>
    </Modal>
  );
}

function PayModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const d = useClinic();
  const due = invoiceTotal(invoice) - invoicePaid(invoice);
  const [amount, setAmount] = useState(due);
  const [method, setMethod] = useState("نقداً");
  const save = () => {
    if (amount <= 0) return;
    update((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === invoice.id ? { ...i, payments: [...i.payments, { id: uid(), amount: Math.min(amount, due), date: todayISO(), method }] } : i)) }), { type: "system", text: `دفعة ${fmtMoney(amount, d.settings.currency)} على الفاتورة #${invoice.number}` });
    onClose();
  };
  return (
    <Modal small title={`دفعة على الفاتورة #${invoice.number}`} onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">المتبقي: <b className="text-foreground">{fmtMoney(due, d.settings.currency)}</b></p>
      <div className="space-y-3">
        <Field label="المبلغ"><input type="number" className="input-control" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} /></Field>
        <Field label="طريقة الدفع"><select className="input-control" value={method} onChange={(e) => setMethod(e.target.value)}><option>نقداً</option><option>بطاقة</option><option>تحويل</option></select></Field>
      </div>
      <div className="mt-6 flex gap-2"><Btn onClick={save}>تسجيل</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></div>
    </Modal>
  );
}
