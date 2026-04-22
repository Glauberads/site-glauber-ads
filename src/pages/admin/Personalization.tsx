import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { uploadToStorage } from "@/lib/storageService";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const Personalization = () => {
  const { settings, save, reload } = useSiteSettings();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [logoLoading, setLogoLoading] = useState(false);
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({ logo: false, favicon: false });

  useEffect(() => {
    setLogoUrl(settings?.logo_url ?? "");
    setFaviconUrl(settings?.favicon_url ?? "");
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
        toast.error(result.error || "Erro ao fazer upload da logo");
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
        toast.error(result.error || "Erro ao fazer upload do favicon");
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

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!logoUrl && !faviconUrl) {
      toast.error("Selecione pelo menos uma imagem");
      return;
    }

    setSaving(true);
    try {
      const ok = await save({
        logo_url: logoUrl || null,
        favicon_url: faviconUrl || null,
      });

      if (ok) {
        toast.success("Configurações salvas com sucesso!", {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });
        setUploadedFiles({ logo: false, favicon: false });
        reload();
      } else {
        toast.error("Erro ao salvar configurações", {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        });
      }
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
