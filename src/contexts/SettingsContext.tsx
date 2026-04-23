import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  whatsapp_number?: string | null;
};

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  reloadSettings: () => Promise<void>;
  /**
   * Returns an object with success flag and optional message for errors.
   */
  saveSettings: (payload: Partial<SiteSettings>) => Promise<{ success: boolean; message?: string }>;
  updateFaviconDynamically: (url: string | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Update favicon dynamically in the DOM
 */
const updateFaviconInDOM = (faviconUrl: string | null) => {
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
  console.log("[Settings] Favicon atualizado:", faviconUrl || "/favicon.png");
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const reloadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[Settings] Buscando configurações do site...");

      const { data, error: fetchError } = await supabase.from("site_settings").select("*").maybeSingle();

      // Se tabela não existe, cria dados vazios (fallback)
      if (fetchError?.code === "PGRST116" || fetchError?.message?.includes("not found")) {
        console.warn("[Settings] Tabela site_settings não encontrada. Usando valores padrão.");
        setSettings({ logo_url: null, favicon_url: null });
        updateFaviconInDOM(null);
        return;
      }

      if (fetchError) {
        console.error("[Settings] Erro ao buscar configurações:", fetchError.message);
        setError(fetchError.message);
        setSettings(null);
        updateFaviconInDOM(null);
        return;
      }

      const resolvedSettings = data ?? { logo_url: null, favicon_url: null };
      setSettings(resolvedSettings);
      updateFaviconInDOM(resolvedSettings.favicon_url);
      console.log("[Settings] Configurações carregadas:", resolvedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("[Settings] Exceção ao carregar configurações:", err);
      setError(errorMessage);
      setSettings(null);
      updateFaviconInDOM(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega configurações na primeira montagem
  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  const updateFaviconDynamically = useCallback((url: string | null) => {
    updateFaviconInDOM(url);
    setSettings((prev) => (prev ? { ...prev, favicon_url: url } : { favicon_url: url }));
  }, []);

  const saveSettings = useCallback(async (payload: Partial<SiteSettings>): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log("[Settings] Salvando configurações:", payload);

      // Try to get existing row
      const { data: existing, error: selectErr } = await supabase.from("site_settings").select("id").maybeSingle();
      if (selectErr) {
        console.error("[Settings] Erro ao buscar row existente:", selectErr);
        setError(selectErr.message || String(selectErr));
        return { success: false, message: selectErr.message || "Erro ao verificar registro existente" };
      }

      if (existing?.id) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", existing.id);
        if (error) {
          console.error("[Settings] Erro ao atualizar site_settings:", error);
          setError(error.message || String(error));
          return { success: false, message: error.message || "Erro ao atualizar configurações" };
        }
      } else {
        const { error } = await supabase.from("site_settings").insert(payload);
        if (error) {
          console.error("[Settings] Erro ao inserir site_settings:", error);
          setError(error.message || String(error));
          return { success: false, message: error.message || "Erro ao inserir configurações" };
        }
      }

      console.log("[Settings] Configurações salvas com sucesso!");

      // Recarregar configurações após salvar
      await reloadSettings();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("[Settings] Exceção ao salvar configurações:", err);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [reloadSettings]);

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    reloadSettings,
    saveSettings,
    updateFaviconDynamically,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

/**
 * Hook para usar as configurações do site em qualquer componente
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings deve ser usado dentro de um SettingsProvider");
  }
  return context;
};

export default SettingsContext;
