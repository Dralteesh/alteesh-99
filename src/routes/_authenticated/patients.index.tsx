import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Plus, Search, UsersRound } from "lucide-react";
import { Badge, Btn, EmptyState, PageHeading } from "@/components/clinic-ui";
import { PatientForm, emptyPatient } from "@/components/patient-form";
import { age, invoicePaid, invoiceTotal, fmtMoney, shortDate, useClinic } from "@/lib/dental-store";

export const Route = createFileRoute("/_authenticated/patients/")({
  head: () => ({
    meta: [
      { title: "المرضى — Alteesh Clinic" },
      { name: "description", content: "سجل مرضى عيادة الأسنان مع البحث وإضافة المرضى." },
      { property: "og:title", content: "المرضى — Alteesh Clinic" },
      { property: "og:description", content: "سجل مرضى عيادة الأسنان." },
    ],
  }),
  component: Patients,
});

function Patients() {
  const d = useClinic();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const list = d.patients.filter((p) => p.name.includes(q) || p.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")));
  const balance = (id: string) => d.invoices.filter((i) => i.patientId === id).reduce((s, i) => s + invoiceTotal(i) - invoicePaid(i), 0);
  const lastVisit = (id: string) => d.appointments.filter((a) => a.patientId === id && a.status === "completed").map((a) => a.date).sort().pop();

  return (
    <>
      <PageHeading eyebrow="السجلات" title="المرضى" description={`${d.patients.length} مريضاً مسجلاً في العيادة`} action={<Btn onClick={() => setAdding(true)}><Plus size={16} />مريض جديد</Btn>} />
      <section className="panel">
        <div className="panel-heading">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input-control pr-9" placeholder="ابحث بالاسم أو رقم الهاتف" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="hidden border-b border-border px-5 py-2.5 text-[11px] font-bold text-muted-foreground md:grid" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 110px", gap: "1rem" }}>
          <div>المريض</div><div>الهاتف</div><div>آخر زيارة</div><div>الرصيد</div><div>ملاحظات</div>
        </div>
        <div className="divide-y divide-border">
          {list.map((p) => {
            const b = balance(p.id); const lv = lastVisit(p.id); const a = age(p.birthDate);
            return (
              <Link key={p.id} to="/patients/$id" params={{ id: p.id }} className="patient-row">
                <div className="flex items-center gap-3"><div className="avatar avatar-teal h-9 w-9 text-sm">{p.name.slice(0, 1)}</div><div><div className="text-sm font-bold">{p.name}</div><div className="text-xs text-muted-foreground">{p.gender}{a !== null ? ` · ${a} سنة` : ""}</div></div></div>
                <div className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex"><Phone size={13} />{p.phone || "—"}</div>
                <div className="hidden text-sm text-muted-foreground md:block">{lv ? shortDate(lv) : "—"}</div>
                <div className={`hidden text-sm font-bold md:block ${b > 0 ? "text-destructive" : "text-muted-foreground"}`}>{b > 0 ? fmtMoney(b, d.settings.currency) : "مسدد"}</div>
                <div>{p.allergies ? <Badge tone="coral">حساسية</Badge> : p.chronic ? <Badge tone="blue">{p.chronic}</Badge> : <Badge>—</Badge>}</div>
              </Link>
            );
          })}
          {list.length === 0 && <EmptyState icon={UsersRound} title="لا يوجد نتائج" text="جرّب بحثاً آخر أو أضف مريضاً جديداً." />}
        </div>
      </section>
      {adding && <PatientForm initial={emptyPatient()} onClose={() => setAdding(false)} />}
    </>
  );
}
