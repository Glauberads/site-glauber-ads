import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SiteSettings = {
  id?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
      if (error) {
        console.error("Error fetching site_settings:", error.message);
        return;
      }
      setSettings(data ?? null);

      // update favicon dynamically if available
      if (data?.favicon_url && typeof window !== "undefined") {
        const href = data.favicon_url;
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = href;
      }
    } catch (err) {
      console.error(err);
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
