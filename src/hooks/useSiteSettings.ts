import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SiteSettings = {
  id?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  whatsapp_number?: string | null;
};

/**
 * Update favicon dynamically
 */
const updateFavicon = (faviconUrl: string | null) => {
  if (typeof window === "undefined") return;

  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }

  // Use dynamic favicon or fallback to static
  link.href = faviconUrl || "/favicon.png";
  console.log("🔄 Favicon updated:", faviconUrl || "/favicon.png");
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
      
      // Se tabela não existe, cria dados vazios (fallback)
      if (error?.code === "PGRST116" || error?.message?.includes("not found")) {
        console.warn("site_settings table not found. Using fallback defaults.");
        setSettings({ logo_url: null, favicon_url: null });
        updateFavicon(null);
        return;
      }

      if (error) {
        console.error("Error fetching site_settings:", error.message);
        setSettings(null);
        updateFavicon(null);
        return;
      }

      setSettings(data ?? null);
      updateFavicon(data?.favicon_url);
    } catch (err) {
      console.error("Error fetching site_settings:", err);
      setSettings(null);
      updateFavicon(null);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async (payload: Partial<SiteSettings>) => {
    try {
      // Try to get existing row
      const { data: existing, error: selectErr } = await supabase.from("site_settings").select("id").maybeSingle();
      if (selectErr) throw selectErr;

      if (existing?.id) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert(payload);
        if (error) throw error;
      }

      await fetchSettings();
      return true;
    } catch (err) {
      console.error("Error saving site_settings:", err);
      return false;
    }
  };

  return { settings, reload: fetchSettings, save: saveSettings } as const;
};
