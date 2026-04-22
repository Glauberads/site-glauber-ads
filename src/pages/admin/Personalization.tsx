import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";

const Personalization = () => {
  const { settings, save, reload } = useSiteSettings();
  const [logo, setLogo] = useState("");
  const [favicon, setFavicon] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLogo(settings?.logo_url ?? "");
    setFavicon(settings?.favicon_url ?? "");
  }, [settings]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await save({ logo_url: logo || null, favicon_url: favicon || null });
    setSaving(false);
    if (ok) {
      toast.success("Configurações salvas");
      reload();
    } else {
      toast.error("Erro ao salvar configurações");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Personalização</h1>
        <p className="text-sm text-muted-foreground">Atualize a logo principal e o favicon do site.</p>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Imagens do site</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="grid gap-4">
            <div className="space-y-2">
              <Label>Logo principal (URL)</Label>
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://.../logo.png" />
            </div>

            <div className="space-y-2">
              <Label>Favicon (URL)</Label>
              <Input value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder="https://.../favicon.png" />
            </div>

            <div className="pt-2">
              <Button type="submit" className="glow-orange" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Personalization;
