import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Settings = {
  id?: string;
  meta_pixel_id: string;
  meta_pixel_script: string;
  gtm_id: string;
  global_site_tag: string;
  custom_head_script: string;
  custom_body_script: string;
};

const empty: Settings = {
  meta_pixel_id: "",
  meta_pixel_script: "",
  gtm_id: "",
  global_site_tag: "",
  custom_head_script: "",
  custom_body_script: "",
};

const Marketing = () => {
  const [s, setS] = useState<Settings>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").maybeSingle().then(({ data }) => {
      if (data) setS({ ...empty, ...data, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ""])) } as Settings);
    });
  }, []);

  const update = (k: keyof Settings, v: string) => setS((c) => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { id, ...rest } = s;
    const payload = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v === "" ? null : v]));
    const { error } = id
      ? await supabase.from("settings").update(payload).eq("id", id)
      : await supabase.from("settings").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas. Recarregue a landing page para aplicar.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketing & Tracking</h1>
          <p className="text-sm text-muted-foreground">Pixels e scripts são injetados automaticamente na landing page.</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2 glow-green">
          <Save className="h-4 w-4" /> Salvar
        </Button>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Meta Pixel</CardTitle>
          <CardDescription>ID do Pixel + script de conversão opcional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pixel ID</Label>
            <Input value={s.meta_pixel_id} onChange={(e) => update("meta_pixel_id", e.target.value)} placeholder="1234567890" />
          </div>
          <div className="space-y-2">
            <Label>Script de conversão</Label>
            <Textarea rows={5} value={s.meta_pixel_script} onChange={(e) => update("meta_pixel_script", e.target.value)} className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Google Tags</CardTitle>
          <CardDescription>GTM ID e Global Site Tag (gtag.js).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>GTM ID</Label>
            <Input value={s.gtm_id} onChange={(e) => update("gtm_id", e.target.value)} placeholder="GTM-XXXXXX" />
          </div>
          <div className="space-y-2">
            <Label>Global Site Tag</Label>
            <Textarea rows={5} value={s.global_site_tag} onChange={(e) => update("global_site_tag", e.target.value)} className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 glow-blue">
        <CardHeader>
          <CardTitle>Scripts Avançados</CardTitle>
          <CardDescription>Scripts personalizados para &lt;head&gt; e &lt;body&gt;.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Head</Label>
            <Textarea rows={6} value={s.custom_head_script} onChange={(e) => update("custom_head_script", e.target.value)} className="font-mono text-xs bg-background" />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea rows={6} value={s.custom_body_script} onChange={(e) => update("custom_body_script", e.target.value)} className="font-mono text-xs bg-background" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Marketing;