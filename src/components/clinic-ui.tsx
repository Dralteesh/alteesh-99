import { type ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, LayoutDashboard, LogOut, Menu, Palette, ShieldCheck, Receipt, Settings, UsersRound, Wallet, X, type LucideIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe, roleLabels } from "@/lib/auth";
import { useBranding, BrandingStyle } from "@/lib/branding";
import { fmtDate, todayISO, type AppointmentStatus } from "@/lib/dental-store";

const navItems = [
  { to: "/", label: "نظرة عامة", icon: LayoutDashboard },
  { to: "/appointments", label: "المواعيد", icon: CalendarDays },
  { to: "/patients", label: "المرضى", icon: UsersRound },
  { to: "/invoices", label: "الفواتير والدفعات", icon: Receipt },
  { to: "/expenses", label: "المصاريف", icon: Wallet },
  { to: "/settings", label: "الإعدادات والخدمات", icon: Settings, admin: true },
  { to: "/users", label: "المستخدمون", icon: ShieldCheck, admin: true },
  { to: "/branding", label: "تخصيص المظهر", icon: Palette, admin: true },
] as { to: "/" | "/appointments" | "/patients" | "/invoices" | "/expenses" | "/settings" | "/users" | "/branding"; label: string; icon: LucideIcon; admin?: boolean }[];
navItems[3]!.admin = true; navItems[4]!.admin = true;

export function Logo() {
  const b = useBranding();
  return (
    <div className="flex items-center gap-3">
      <div className="logo-mark"><img src={b.logo} alt={`شعار ${b.clinic_name}`} /></div>
      <div>
        <div className="font-display text-base font-bold leading-tight text-primary">{b.clinic_name}</div>
        <div className="text-[10px] tracking-wide text-muted-foreground">{b.tagline}</div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const me = useMe();
  const qc = useQueryClient();
  const isAdmin = me.data?.role === "admin";
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); location.replace("/auth"); };
  return (
    <div dir="rtl" className="min-h-[100dvh] bg-background">
      <BrandingStyle />
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="mb-10 flex items-center justify-between px-1">
          <Logo />
          <button className="text-muted-foreground md:hidden" onClick={() => setOpen(false)} aria-label="إغلاق القائمة"><X size={20} /></button>
        </div>
        <div className="mb-3 px-3 text-[10px] font-bold tracking-[.16em] text-muted-foreground">مساحة العمل</div>
        <nav className="space-y-1">
          {navItems.filter((i) => !i.admin || isAdmin).map((item) => {
            const Icon = item.icon;
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={`nav-link ${active ? "nav-link-active" : ""}`}>
                <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
                <span>{item.label}</span>
                {item.to === "/appointments" && <span className="mr-auto rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent-foreground">اليوم</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-note mt-auto">
          <div className="mb-3 flex items-center gap-2 text-primary"><div className="h-2 w-2 rounded-full bg-primary" /><span className="text-xs font-bold">النظام يعمل بشكل طبيعي</span></div>
          <p className="text-xs leading-6 text-muted-foreground">البيانات محفوظة ومشتركة بين كل مستخدمي العيادة.</p>
          <button onClick={signOut} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-destructive hover:underline"><LogOut size={14} />تسجيل الخروج</button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-foreground/20 md:hidden" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />}
      <main className="md:mr-[260px]">
        <header className="topbar">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="فتح القائمة"><Menu size={22} /></button>
          <div className="hidden text-sm text-muted-foreground md:block">{fmtDate(todayISO())}</div>
          <div className="mr-auto flex items-center gap-3">
            <div className="hidden text-left sm:block">
              <div className="text-sm font-bold">{me.data?.name}</div>
              <div className="text-xs text-muted-foreground">{me.data?.role ? roleLabels[me.data.role] : ""}</div>
            </div>
            <div className="avatar avatar-coral h-10 w-10">{(me.data?.name ?? "?").slice(0, 1)}</div>
            <button className="icon-btn" onClick={signOut} aria-label="تسجيل الخروج"><LogOut size={16} /></button>
          </div>
        </header>
        <div className="page-wrap">{children}</div>
      </main>
    </div>
  );
}

export function Btn({ children, variant = "primary", className = "", ...rest }: { children: ReactNode; variant?: "primary" | "quiet" | "outline" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = { primary: "bg-primary text-primary-foreground hover:brightness-95", quiet: "bg-secondary text-secondary-foreground hover:bg-muted", outline: "border border-border bg-card text-foreground hover:bg-secondary", danger: "bg-destructive/10 text-destructive hover:bg-destructive/15" };
  return <button type="button" {...rest} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 ${styles[variant]} ${className}`}>{children}</button>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "teal" | "coral" | "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export const statusTone: Record<AppointmentStatus, "neutral" | "teal" | "coral" | "blue"> = { scheduled: "neutral", confirmed: "teal", progress: "coral", completed: "blue", cancelled: "neutral" };

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-xs font-bold tracking-[.14em] text-primary">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, note, icon: Icon, color }: { label: string; value: string; note: string; icon: LucideIcon; color: "teal" | "coral" | "blue" | "sand" }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div><div className="text-sm text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-bold tracking-tight">{value}</div></div>
        <div className={`stat-icon ${color}`}><Icon size={19} /></div>
      </div>
      <div className="mt-4 text-xs text-muted-foreground">{note}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={22} /></div>
      <div className="font-display text-sm font-bold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

export function Modal({ title, onClose, children, small }: { title: string; onClose: () => void; children: ReactNode; small?: boolean }) {
  return (
    <div className="modal-backdrop" dir="rtl" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-card ${small ? "modal-small" : ""}`}>
        <div className="panel-heading">
          <h2 className="font-display text-base font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="إغلاق"><X size={19} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
