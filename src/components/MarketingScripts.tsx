import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const injectScripts = (raw: string, target: HTMLElement, id: string) => {
  if (!raw?.trim()) return;
  const container = document.createElement("div");
  container.innerHTML = raw;
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeName === "SCRIPT") {
      const orig = node as HTMLScriptElement;
      const s = document.createElement("script");
      Array.from(orig.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      s.text = orig.textContent ?? "";
      s.dataset.injected = id;
      target.appendChild(s);
    } else {
      const wrapper = document.createElement("div");
      wrapper.dataset.injected = id;
      wrapper.appendChild(node);
      target.appendChild(wrapper);
    }
  });
};

const cleanup = (id: string) => {
  document.querySelectorAll(`[data-injected="${id}"]`).forEach((el) => el.remove());
};

export const MarketingScripts = () => {
  useEffect(() => {
    let cancelled = false;
    supabase.from("settings").select("*").limit(1).maybeSingle().then(({ data }) => {
      if (cancelled || !data) return;
      const meta = data.meta_pixel_id
        ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${data.meta_pixel_id}');fbq('track','PageView');</script>`
        : "";
      const gtm = data.gtm_id
        ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${data.gtm_id}');</script>`
        : "";
      injectScripts(meta + (data.meta_pixel_script ?? "") + gtm + (data.global_site_tag ?? "") + (data.custom_head_script ?? ""), document.head, "ga-head");
      injectScripts(data.custom_body_script ?? "", document.body, "ga-body");
    });
    return () => {
      cancelled = true;
      cleanup("ga-head");
      cleanup("ga-body");
    };
  }, []);
  return null;
};