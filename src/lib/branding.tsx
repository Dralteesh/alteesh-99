import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/alteesh-clinic-logo.png";

export type Branding = {
  clinic_name: string;
  tagline: string;
  welcome_title: string;
  welcome_text: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  background_url: string | null;
};

export const defaultBranding: Branding = {
  clinic_name: "Alteesh Clinic",
  tagline: "إدارة عيادة الأسنان",
  welcome_title: "أهلاً بك في العيادة",
  welcome_text: "إليك صورة سريعة عن سير العمل اليوم.",
  primary_color: "#28777d",
  accent_color: "#e79274",
  logo_url: null,
  background_url: null,
};

export const brandingKey = ["branding"];

export function useBranding() {
  const q = useQuery({
    queryKey: brandingKey,
    queryFn: async (): Promise<Branding> => {
      const { data } = await supabase.from("clinic_branding").select("*").eq("id", 1).maybeSingle();
      return { ...defaultBranding, ...(data ?? {}) } as Branding;
    },
    staleTime: 60_000,
  });
  const b = q.data ?? defaultBranding;
  return { ...b, logo: b.logo_url || defaultLogo };
}

/** Applies the clinic's custom colors on top of the design tokens. */
export function BrandingStyle() {
  const b = useBranding();
  const css = `:root{--primary:${b.primary_color};--ring:${b.primary_color};--sidebar-primary:${b.primary_color};--sidebar-ring:${b.primary_color};--accent:${b.accent_color};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/** Reads an image file and shrinks it into a compact data URL for storage. */
export function fileToDataUrl(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const png = file.type === "image/png" || file.type === "image/svg+xml";
      resolve(c.toDataURL(png ? "image/png" : "image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}
