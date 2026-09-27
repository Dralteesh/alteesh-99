import { useState } from "react";
import { Btn, Field, Modal } from "@/components/clinic-ui";
import { todayISO, uid, update, type Patient } from "@/lib/dental-store";

export const emptyPatient = (): Patient => ({ id: "", name: "", phone: "", gender: "أنثى", birthDate: "", address: "", allergies: "", chronic: "", notes: "", createdAt: todayISO() });

export function PatientForm({ initial, onClose, onSaved }: { initial: Patient; onClose: () => void; onSaved?: (id: string) => void }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState("");
  const set = <K extends keyof Patient>(k: K, v: Patient[K]) => setF({ ...f, [k]: v });
  const save = () => {
    if (!f.name.trim()) return setErr("اسم المريض مطلوب.");
    const id = f.id || uid();
    if (f.id) update((s) => ({ ...s, patients: s.patients.map((p) => (p.id === f.id ? f : p)) }), { type: "patient", text: `تم تحديث ملف ${f.name}` });
    else update((s) => ({ ...s, patients: [{ ...f, id }, ...s.patients] }), { type: "patient", text: `أضيف ${f.name} كمريض جديد` });
    onSaved?.(id);
    onClose();
  };
  return (
    <Modal title={f.id ? "تعديل بيانات المريض" : "مريض جديد"} onClose={onClose}>
      <div className="form-grid">
        <Field label="الاسم الكامل"><input className="input-control" value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="رقم الهاتف"><input className="input-control" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="الجنس"><select className="input-control" value={f.gender} onChange={(e) => set("gender", e.target.value as Patient["gender"])}><option>أنثى</option><option>ذكر</option></select></Field>
        <Field label="تاريخ الميلاد"><input type="date" className="input-control" value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} /></Field>
        <Field label="العنوان" full><input className="input-control" value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="الحساسية"><input className="input-control" value={f.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="مثال: البنسلين" /></Field>
        <Field label="أمراض مزمنة"><input className="input-control" value={f.chronic} onChange={(e) => set("chronic", e.target.value)} placeholder="مثال: سكري" /></Field>
        <Field label="ملاحظات" full><textarea className="input-control min-h-20" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>
      {err && <p className="mt-3 text-xs font-bold text-destructive">{err}</p>}
      <div className="mt-6 flex gap-2"><Btn onClick={save}>حفظ</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></div>
    </Modal>
  );
}
