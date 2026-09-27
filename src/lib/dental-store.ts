import { useSyncExternalStore } from "react";

export type AppointmentStatus = "scheduled" | "confirmed" | "progress" | "completed" | "cancelled";
export type Doctor = { id: string; name: string; specialty: string; active: boolean };
export type Service = { id: string; name: string; price: number };
export type Patient = {
  id: string; name: string; phone: string; gender: "ذكر" | "أنثى"; birthDate: string; address: string;
  allergies: string; chronic: string; notes: string; createdAt: string;
};
export type Appointment = { id: string; patientId: string; doctorId: string; date: string; time: string; duration: number; reason: string; status: AppointmentStatus };
export type ToothCondition = "healthy" | "caries" | "filled" | "crown" | "root" | "missing" | "implant";
export type ToothRecord = { tooth: number; condition: ToothCondition; note: string };
export type Treatment = { id: string; patientId: string; doctorId: string; serviceId: string; tooth: string; date: string; notes: string; price: number };
export type Prescription = { id: string; patientId: string; doctorId: string; date: string; drug: string; dosage: string; duration: string };
export type InvoiceItem = { name: string; qty: number; price: number };
export type Payment = { id: string; amount: number; date: string; method: string };
export type Invoice = { id: string; number: number; patientId: string; date: string; items: InvoiceItem[]; payments: Payment[]; discount: number };
export type Expense = { id: string; date: string; category: string; description: string; amount: number };
export type Activity = { id: string; type: "appointment" | "patient" | "team" | "system"; text: string; at: string };
export type Settings = { clinicName: string; branch: string; phone: string; currency: string; openAt: string; closeAt: string };

export type ClinicData = {
  settings: Settings; doctors: Doctor[]; services: Service[]; patients: Patient[]; appointments: Appointment[];
  teeth: Record<string, ToothRecord[]>; treatments: Treatment[]; prescriptions: Prescription[];
  invoices: Invoice[]; expenses: Expense[]; activities: Activity[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);
const offset = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

export const statusLabels: Record<AppointmentStatus, string> = { scheduled: "مجدول", confirmed: "مؤكد", progress: "قيد العلاج", completed: "مكتمل", cancelled: "ملغى" };
export const conditionLabels: Record<ToothCondition, string> = { healthy: "سليم", caries: "تسوس", filled: "حشوة", crown: "تاج", root: "معالجة لب", missing: "مفقود", implant: "زرعة" };

function seed(): ClinicData {
  const t = todayISO();
  return {
    settings: { clinicName: "Alteesh Clinic", branch: "دمشق · المزة", phone: "011 000 0000", currency: "ل.س", openAt: "09:00", closeAt: "17:00" },
    doctors: [
      { id: "d1", name: "د. ميساء الطيش", specialty: "تقويم الأسنان", active: true },
      { id: "d2", name: "د. سامر حداد", specialty: "جراحة الفم", active: true },
      { id: "d3", name: "د. لينا خوري", specialty: "طب أسنان الأطفال", active: true },
    ],
    services: [
      { id: "s1", name: "فحص واستشارة", price: 50000 },
      { id: "s2", name: "تنظيف وتلميع", price: 150000 },
      { id: "s3", name: "حشوة تجميلية", price: 250000 },
      { id: "s4", name: "معالجة لب (عصب)", price: 600000 },
      { id: "s5", name: "قلع سن", price: 120000 },
      { id: "s6", name: "تاج خزفي", price: 900000 },
    ],
    patients: [
      { id: "p1", name: "رنا العلي", phone: "0933 111 222", gender: "أنثى", birthDate: "1992-04-12", address: "المزة", allergies: "البنسلين", chronic: "", notes: "", createdAt: offset(-20) },
      { id: "p2", name: "محمد الشامي", phone: "0944 333 444", gender: "ذكر", birthDate: "1985-09-03", address: "كفرسوسة", allergies: "", chronic: "سكري", notes: "يفضل المواعيد الصباحية", createdAt: offset(-5) },
      { id: "p3", name: "سلمى يوسف", phone: "0955 555 666", gender: "أنثى", birthDate: "2014-01-20", address: "المالكي", allergies: "", chronic: "", notes: "", createdAt: offset(-2) },
      { id: "p4", name: "خالد النجار", phone: "0966 777 888", gender: "ذكر", birthDate: "1978-11-30", address: "باب توما", allergies: "", chronic: "ضغط", notes: "", createdAt: offset(-40) },
    ],
    appointments: [
      { id: "a1", patientId: "p1", doctorId: "d1", date: t, time: "09:30", duration: 30, reason: "مراجعة تقويم", status: "confirmed" },
      { id: "a2", patientId: "p2", doctorId: "d2", date: t, time: "10:00", duration: 60, reason: "قلع ضرس العقل", status: "progress" },
      { id: "a3", patientId: "p3", doctorId: "d3", date: t, time: "11:30", duration: 30, reason: "فحص دوري", status: "scheduled" },
      { id: "a4", patientId: "p4", doctorId: "d1", date: t, time: "13:00", duration: 45, reason: "تركيب تاج", status: "scheduled" },
      { id: "a5", patientId: "p1", doctorId: "d2", date: offset(1), time: "10:30", duration: 30, reason: "تنظيف", status: "scheduled" },
    ],
    teeth: { p2: [{ tooth: 38, condition: "caries", note: "ضرس عقل منطمر" }, { tooth: 16, condition: "filled", note: "" }], p4: [{ tooth: 21, condition: "root", note: "بانتظار تاج" }, { tooth: 46, condition: "missing", note: "" }] },
    treatments: [{ id: "t1", patientId: "p4", doctorId: "d1", serviceId: "s4", tooth: "21", date: offset(-10), notes: "جلستان", price: 600000 }],
    prescriptions: [{ id: "r1", patientId: "p2", doctorId: "d2", date: t, drug: "أموكسيسيلين 500 ملغ", dosage: "حبة كل 8 ساعات", duration: "5 أيام" }],
    invoices: [
      { id: "i1", number: 1001, patientId: "p4", date: offset(-10), items: [{ name: "معالجة لب (عصب)", qty: 1, price: 600000 }], payments: [{ id: "y1", amount: 400000, date: offset(-10), method: "نقداً" }], discount: 0 },
      { id: "i2", number: 1002, patientId: "p1", date: offset(-3), items: [{ name: "فحص واستشارة", qty: 1, price: 50000 }], payments: [{ id: "y2", amount: 50000, date: offset(-3), method: "نقداً" }], discount: 0 },
    ],
    expenses: [
      { id: "e1", date: offset(-4), category: "مواد طبية", description: "مواد حشو وتخدير", amount: 350000 },
      { id: "e2", date: offset(-1), category: "إيجار", description: "إيجار الشهر", amount: 1500000 },
    ],
    activities: [
      { id: "ac1", type: "appointment", text: "تم تأكيد موعد رنا العلي", at: new Date().toISOString() },
      { id: "ac2", type: "patient", text: "أضيفت سلمى يوسف كمريضة جديدة", at: new Date().toISOString() },
    ],
  };
}

const KEY = "dental-clinic-data-v1";
let state: ClinicData = seed();
let loaded = false;
const listeners = new Set<() => void>();
const serverSnapshot = seed();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...seed(), ...JSON.parse(raw) }; } catch { /* ignore */ }
}

export function update(fn: (d: ClinicData) => ClinicData, activity?: { type: Activity["type"]; text: string }) {
  load();
  let next = fn(state);
  if (activity) next = { ...next, activities: [{ id: uid(), ...activity, at: new Date().toISOString() }, ...next.activities].slice(0, 40) };
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function resetData() { update(() => seed(), { type: "system", text: "تمت إعادة البيانات التجريبية" }); }

export function useClinic(): ClinicData {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => serverSnapshot,
  );
}

export const invoiceTotal = (i: Invoice) => i.items.reduce((s, x) => s + x.qty * x.price, 0) - (i.discount || 0);
export const invoicePaid = (i: Invoice) => i.payments.reduce((s, p) => s + p.amount, 0);
export const fmtMoney = (n: number, cur = "ل.س") => `${n.toLocaleString("ar-SY")} ${cur}`;
export const fmtDate = (iso: string) => new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("ar-SY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const shortDate = (iso: string) => new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("ar-SY", { day: "numeric", month: "short" });
export const age = (birth: string) => birth ? Math.floor((Date.now() - new Date(birth).getTime()) / 31557600000) : null;
