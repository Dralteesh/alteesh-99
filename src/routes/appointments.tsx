import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Btn, Field, Modal, PageHeading } from "@/components/clinic-ui";
import { fmtDate, statusLabels, todayISO, uid, update, useClinic, type Appointment, type AppointmentStatus } from "@/lib/dental-store";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [
      { title: "جدول المواعيد — Alteesh Clinic" },
      { name: "description", content: "جدول يومي لمواعيد الأطباء مع الحجز وتغيير حالة الموعد." },
      { property: "og:title", content: "جدول المواعيد — Alteesh Clinic" },
      { property: "og:description", content: "جدول يومي لمواعيد الأطباء." },
    ],
  }),
  component: Schedule,
});

const statusClass: Record<AppointmentStatus, string> = { scheduled: "status-scheduled", confirmed: "status-confirmed", progress: "status-progress", completed: "status-completed", cancelled: "status-cancelled" };
const shift = (iso: string, n: number) => { const x = new Date(iso + "T00:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

function Schedule() {
  const d = useClinic();
  const [date, setDate] = useState(todayISO());
  const [editing, setEditing] = useState<Appointment | null>(null);
  const doctors = d.doctors.filter((x) => x.active);
  const [oh] = d.settings.openAt.split(":").map(Number);
  const [ch] = d.settings.closeAt.split(":").map(Number);
  const slots: string[] = [];
  for (let h = oh; h < ch; h++) { slots.push(`${String(h).padStart(2, "0")}:00`); slots.push(`${String(h).padStart(2, "0")}:30`); }
  const day = d.appointments.filter((a) => a.date === date);
  const pname = (id: string) => d.patients.find((p) => p.id === id)?.name ?? "—";
  const blank = (doctorId = doctors[0]?.id ?? "", time = "09:00"): Appointment => ({ id: "", patientId: d.patients[0]?.id ?? "", doctorId, date, time, duration: 30, reason: "", status: "scheduled" });

  return (
    <>
      <PageHeading eyebrow="المواعيد" title="الجدول اليومي" description="اضغط على أي خانة فارغة لحجز موعد، أو على موعد لتعديله." action={<Btn onClick={() => setEditing(blank())}><Plus size={16} />موعد جديد</Btn>} />
      <section className="panel">
        <div className="schedule-toolbar border-b border-border">
          <div className="flex items-center gap-2">
            <button className="icon-btn" onClick={() => setDate(shift(date, 1))} aria-label="اليوم التالي"><ChevronRight size={17} /></button>
            <div className="date-selector">{fmtDate(date)}</div>
            <button className="icon-btn" onClick={() => setDate(shift(date, -1))} aria-label="اليوم السابق"><ChevronLeft size={17} /></button>
            <Btn variant="quiet" onClick={() => setDate(todayISO())}>اليوم</Btn>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {(Object.keys(statusLabels) as AppointmentStatus[]).map((s) => <span key={s} className="inline-flex items-center gap-1.5"><span className={`legend-dot ${statusClass[s]}`} style={{ background: "currentColor" }} />{statusLabels[s]}</span>)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="schedule-head"><div className="w-[76px] shrink-0">الوقت</div>{doctors.map((doc) => <div key={doc.id} className="doctor-head flex-1"><div><div className="text-sm text-foreground">{doc.name}</div><div className="font-normal">{doc.specialty}</div></div></div>)}</div>
            {slots.map((slot) => (
              <div key={slot} className="schedule-row">
                <div className="time-label">{slot}</div>
                {doctors.map((doc) => {
                  const appt = day.find((a) => a.doctorId === doc.id && a.time === slot);
                  return (
                    <div key={doc.id} className="schedule-cell flex-1">
                      {appt ? (
                        <button className={`appointment-block ${statusClass[appt.status]}`} onClick={() => setEditing(appt)}>
                          <b>{appt.time} · {appt.duration} د</b><strong>{pname(appt.patientId)}</strong><span>{appt.reason || "—"}</span>
                        </button>
                      ) : (
                        <button className="h-full min-h-[63px] w-full rounded-lg text-xs text-transparent transition hover:bg-secondary/60 hover:text-muted-foreground" onClick={() => setEditing(blank(doc.id, slot))}>+ حجز</button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
      {editing && <AppointmentForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function AppointmentForm({ initial, onClose }: { initial: Appointment; onClose: () => void }) {
  const d = useClinic();
  const [f, setF] = useState(initial);
  const [err, setErr] = useState("");
  const set = <K extends keyof Appointment>(k: K, v: Appointment[K]) => setF({ ...f, [k]: v });
  const save = () => {
    if (!f.patientId) return setErr("اختر المريض أولاً.");
    const clash = d.appointments.find((a) => a.id !== f.id && a.doctorId === f.doctorId && a.date === f.date && a.time === f.time && a.status !== "cancelled");
    if (clash) return setErr("يوجد موعد آخر لهذا الطبيب في نفس الوقت.");
    const pn = d.patients.find((p) => p.id === f.patientId)?.name;
    if (f.id) update((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === f.id ? f : a)) }), { type: "appointment", text: `تم تحديث موعد ${pn} (${statusLabels[f.status]})` });
    else update((s) => ({ ...s, appointments: [...s.appointments, { ...f, id: uid() }] }), { type: "appointment", text: `حجز موعد جديد لـ ${pn}` });
    onClose();
  };
  const remove = () => { update((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== f.id) }), { type: "appointment", text: "تم حذف موعد" }); onClose(); };
  return (
    <Modal title={f.id ? "تعديل الموعد" : "موعد جديد"} onClose={onClose}>
      <div className="form-grid">
        <Field label="المريض"><select className="input-control" value={f.patientId} onChange={(e) => set("patientId", e.target.value)}>{d.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="الطبيب"><select className="input-control" value={f.doctorId} onChange={(e) => set("doctorId", e.target.value)}>{d.doctors.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
        <Field label="التاريخ"><input type="date" className="input-control" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="الوقت"><input type="time" step={1800} className="input-control" value={f.time} onChange={(e) => set("time", e.target.value)} /></Field>
        <Field label="المدة (دقيقة)"><select className="input-control" value={f.duration} onChange={(e) => set("duration", Number(e.target.value))}>{[15, 30, 45, 60, 90].map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
        <Field label="سبب الزيارة"><input className="input-control" value={f.reason} onChange={(e) => set("reason", e.target.value)} placeholder="مثال: تنظيف" /></Field>
        <Field label="الحالة" full>
          <div className="flex flex-wrap gap-2">{(Object.keys(statusLabels) as AppointmentStatus[]).map((s) => <button key={s} type="button" onClick={() => set("status", s)} className={`status-choice ${f.status === s ? "status-choice-active" : ""}`}>{statusLabels[s]}</button>)}</div>
        </Field>
      </div>
      {d.patients.length === 0 && <p className="mt-3 text-xs text-destructive">لا يوجد مرضى بعد. <Link to="/patients" className="underline">أضف مريضاً</Link></p>}
      {err && <p className="mt-3 text-xs font-bold text-destructive">{err}</p>}
      <div className="mt-6 flex items-center gap-2">
        <Btn onClick={save}>حفظ</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn>
        {f.id && <Btn variant="danger" className="mr-auto" onClick={remove}><Trash2 size={15} />حذف</Btn>}
      </div>
    </Modal>
  );
}
