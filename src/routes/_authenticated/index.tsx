import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CalendarDays, Check, Plus, Receipt, UsersRound, Wallet } from "lucide-react";
import { Badge, EmptyState, PageHeading, StatCard, statusTone } from "@/components/clinic-ui";
import { useBranding } from "@/lib/branding";
import { fmtDate, fmtMoney, invoicePaid, invoiceTotal, statusLabels, todayISO, useClinic } from "@/lib/dental-store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "نظرة عامة — Alteesh Clinic" },
      { name: "description", content: "لوحة متابعة يومية لعيادة الأسنان: المواعيد والمرضى والإيرادات." },
      { property: "og:title", content: "نظرة عامة — Alteesh Clinic" },
      { property: "og:description", content: "لوحة متابعة يومية لعيادة الأسنان." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const d = useClinic();
  const br = useBranding();
  const t = todayISO();
  const todays = d.appointments.filter((a) => a.date === t && a.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  const monthPrefix = t.slice(0, 7);
  const income = d.invoices.flatMap((i) => i.payments).filter((p) => p.date.startsWith(monthPrefix)).reduce((s, p) => s + p.amount, 0);
  const expenses = d.expenses.filter((e) => e.date.startsWith(monthPrefix)).reduce((s, e) => s + e.amount, 0);
  const debt = d.invoices.reduce((s, i) => s + Math.max(0, invoiceTotal(i) - invoicePaid(i)), 0);
  const newPatients = d.patients.filter((p) => (Date.now() - new Date(p.createdAt).getTime()) / 864e5 <= 7).length;
  const name = (id: string) => d.patients.find((p) => p.id === id)?.name ?? "—";
  const doc = (id: string) => d.doctors.find((x) => x.id === id)?.name ?? "—";

  return (
    <>
      <PageHeading eyebrow={fmtDate(t)} title={br.welcome_title} description={br.welcome_text}
        action={<Link to="/appointments" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-95"><CalendarDays size={17} />فتح جدول المواعيد</Link>} />
      <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="مواعيد اليوم" value={`${todays.length}`} note={`${todays.filter((a) => a.status === "confirmed").length} مؤكدة`} icon={CalendarDays} color="teal" />
        <StatCard label="مرضى جدد" value={`${newPatients}`} note="خلال الأيام السبعة الماضية" icon={UsersRound} color="coral" />
        <StatCard label="إيرادات الشهر" value={fmtMoney(income, d.settings.currency)} note={`المصاريف: ${fmtMoney(expenses, d.settings.currency)}`} icon={Wallet} color="blue" />
        <StatCard label="مبالغ غير مسددة" value={fmtMoney(debt, d.settings.currency)} note="على جميع الفواتير" icon={Receipt} color="sand" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_.85fr]">
        <section className="panel">
          <div className="panel-heading">
            <div><h2 className="font-display text-base font-bold">جدول اليوم</h2><p className="mt-1 text-xs text-muted-foreground">المواعيد مرتبة حسب الوقت</p></div>
            <Link to="/appointments" className="text-xs font-bold text-primary hover:underline">عرض الكل</Link>
          </div>
          <div className="divide-y divide-border">
            {todays.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-14 font-mono text-xs text-muted-foreground">{a.time}</div>
                <div className="avatar avatar-teal h-9 w-9 text-sm">{name(a.patientId).slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <Link to="/patients/$id" params={{ id: a.patientId }} className="block truncate text-sm font-bold hover:text-primary">{name(a.patientId)}</Link>
                  <div className="truncate text-xs text-muted-foreground">{a.reason} · {doc(a.doctorId)}</div>
                </div>
                <Badge tone={statusTone[a.status]}>{statusLabels[a.status]}</Badge>
              </div>
            ))}
            {todays.length === 0 && <EmptyState icon={CalendarDays} title="لا توجد مواعيد اليوم" text="ابدأ بإضافة موعد جديد إلى الجدول." />}
          </div>
        </section>
        <section className="panel p-5">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="font-display text-base font-bold">آخر النشاطات</h2><p className="mt-1 text-xs text-muted-foreground">سجل التغييرات في العيادة</p></div>
            <Activity size={19} className="text-primary" />
          </div>
          <div className="space-y-5">
            {d.activities.slice(0, 6).map((a) => (
              <div className="activity-row" key={a.id}>
                <div className={`activity-dot dot-${a.type}`} />
                <div className="text-sm leading-6">{a.text}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="quick-actions mt-5">
        <div><div className="font-display text-sm font-bold">إجراءات سريعة</div><div className="text-xs text-muted-foreground">اختصارات للمهام اليومية</div></div>
        <div className="flex flex-wrap gap-2">
          <Link to="/patients" className="quick-action"><Plus size={15} />مريض جديد</Link>
          <Link to="/appointments" className="quick-action"><CalendarDays size={15} />حجز موعد</Link>
          <Link to="/invoices" className="quick-action"><Receipt size={15} />فاتورة جديدة</Link>
          <Link to="/expenses" className="quick-action"><Check size={15} />تسجيل مصروف</Link>
        </div>
      </div>
    </>
  );
}
