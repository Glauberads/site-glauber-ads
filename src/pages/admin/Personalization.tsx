import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/contexts/SettingsContext";
import { uploadToStorage } from "@/lib/storageService";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Phone } from "lucide-react";

const Personalization = () => {
  const { settings, saveSettings } = useSettings();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [logoLoading, setLogoLoading] = useState(false);
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({ logo: false, favicon: false });

  useEffect(() => {
    setLogoUrl(settings?.logo_url ?? "");
    setFaviconUrl(settings?.favicon_url ?? "");
    setWhatsappNumber(settings?.whatsapp_number ?? "");
  }, [settings]);

  const handleLogoUpload = async (file: File) => {
    setLogoLoading(true);
    try {
      const result = await uploadToStorage(file, "logos");
      if (result.success && result.publicUrl) {
        setLogoUrl(result.publicUrl);
        setUploadedFiles((prev) => ({ ...prev, logo: true }));
        toast.success("Logo enviada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao fazer upload da logo", { duration: 6000 });
      }
    } finally {
      setLogoLoading(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    setFaviconLoading(true);
    try {
      const result = await uploadToStorage(file, "favicons");
      if (result.success && result.publicUrl) {
        setFaviconUrl(result.publicUrl);
        setUploadedFiles((prev) => ({ ...prev, favicon: true }));
        toast.success("Favicon enviado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao fazer upload do favicon", { duration: 6000 });
      }
    } finally {
      setFaviconLoading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    setUploadedFiles((prev) => ({ ...prev, logo: false }));
  };

  const handleRemoveFavicon = () => {
    setFaviconUrl("");
    setUploadedFiles((prev) => ({ ...prev, favicon: false }));
  };

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);

      // Save logo and favicon URLs
      const updatedSettings = {
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        whatsapp_number: whatsappNumber, // Include WhatsApp number
      };

      const result = await saveSettings(updatedSettings);

      if (result.success) {
        toast.success("Configurações salvas com sucesso!");
        setUploadedFiles({ logo: false, favicon: false });
      } else {
        console.error("Erro ao salvar configurações:", result.message);
        toast.error(result.message || "Erro ao salvar configurações. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = uploadedFiles.logo || uploadedFiles.favicon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Personalização</h1>
        <p className="text-sm text-muted-foreground">Atualize a logo principal e o favicon do site via upload de arquivo.</p>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Imagens do Site</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="grid gap-8">
            {/* Upload Logo */}
            <div>
              <FileUpload
                label="Logo Principal"
                placeholder="Clique ou arraste sua logo aqui"
                previewUrl={logoUrl}
                isLoading={logoLoading}
                onFileSelect={handleLogoUpload}
                onRemove={logoUrl ? handleRemoveLogo : undefined}
              />
              {logoUrl && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> URL da logo carregada
                </p>
              )}
            </div>

            {/* Upload Favicon */}
            <div>
              <FileUpload
                label="Favicon"
                placeholder="Clique ou arraste seu favicon aqui"
                previewUrl={faviconUrl}
                isLoading={faviconLoading}
                onFileSelect={handleFaviconUpload}
                onRemove={faviconUrl ? handleRemoveFavicon : undefined}
              />
              {faviconUrl && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> URL do favicon carregada
                </p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Número do WhatsApp
              </Label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="11 99999-9999"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                Número usado para redirecionamento após captura de leads
              </p>
            </div>

            {/* Info Box */}
            {hasChanges && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-primary flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                  Alterações pendentes - clique em "Salvar Alterações" para confirmar
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="glow-orange w-full"
                disabled={saving || !hasChanges}
                size="lg"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-border/40 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Formatos aceitos: PNG, JPG, WEBP, SVG</p>
          <p>• Tamanho máximo: 5MB por arquivo</p>
          <p>• Logo recomendada: 256×256px ou maior</p>
          <p>• Favicon recomendado: 32×32px ou 64×64px</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Personalization;
