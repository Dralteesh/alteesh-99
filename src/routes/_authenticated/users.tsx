import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { Btn, Field, Modal, PageHeading } from "@/components/clinic-ui";
import { createUser, deleteUser, listUsers, setUserRole } from "@/lib/users.functions";
import { useMe } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "المستخدمون — Alteesh Clinic" }, { name: "description", content: "إدارة حسابات الأطباء والمديرين." }] }),
  component: UsersPage,
});

function UsersPage() {
  const me = useMe();
  const qc = useQueryClient();
  const list = useServerFn(listUsers), create = useServerFn(createUser), setRole = useServerFn(setUserRole), del = useServerFn(deleteUser);
  const q = useQuery({ queryKey: ["users"], queryFn: () => list(), enabled: me.data?.role === "admin" });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name: "", email: "", password: "", role: "doctor" as "admin" | "doctor" });
  const [err, setErr] = useState("");
  const run = async (fn: () => Promise<unknown>) => { setErr(""); try { await fn(); qc.invalidateQueries({ queryKey: ["users"] }); return true; } catch (e) { setErr((e as Error).message); return false; } };

  if (me.data?.role !== "admin") return <p className="text-sm text-muted-foreground">هذه الصفحة للمدير فقط.</p>;
  return (
    <>
      <PageHeading eyebrow="الإدارة" title="المستخدمون" description="أضف الأطباء والمديرين وحدد صلاحياتهم." action={<Btn onClick={() => setOpen(true)}><Plus size={15} />مستخدم جديد</Btn>} />
      {err && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
      <div className="panel divide-y divide-border">
        {q.isLoading && <div className="p-5 text-sm text-muted-foreground">جارٍ التحميل…</div>}
        {q.data?.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="avatar avatar-coral h-10 w-10">{(u.full_name || u.email || "?").slice(0, 1)}</div>
            <div className="min-w-0 flex-1"><div className="text-sm font-bold">{u.full_name}</div><div className="truncate text-xs text-muted-foreground">{u.email}</div></div>
            <select className="input-control w-36" disabled={u.id === me.data?.id} value={u.role ?? ""} onChange={(e) => run(() => setRole({ data: { userId: u.id, role: (e.target.value || null) as "admin" | "doctor" | null } }))}>
              <option value="">بدون صلاحية</option><option value="doctor">طبيب</option><option value="admin">مدير</option>
            </select>
            {u.id !== me.data?.id && <button className="icon-btn" aria-label="حذف" onClick={() => confirm("حذف هذا المستخدم؟") && run(() => del({ data: { userId: u.id } }))}><Trash2 size={15} /></button>}
          </div>
        ))}
      </div>
      {open && (
        <Modal title="مستخدم جديد" small onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="الاسم"><input className="input-control" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
            <Field label="البريد"><input type="email" dir="ltr" className="input-control" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="كلمة المرور (8 أحرف على الأقل)"><input type="password" dir="ltr" className="input-control" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            <Field label="الصلاحية"><select className="input-control" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "admin" | "doctor" })}><option value="doctor">طبيب</option><option value="admin">مدير</option></select></Field>
            {err && <div className="text-xs text-destructive">{err}</div>}
            <Btn className="w-full" onClick={async () => { if (await run(() => create({ data: f }))) { setOpen(false); setF({ full_name: "", email: "", password: "", role: "doctor" }); } }}>إنشاء</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
