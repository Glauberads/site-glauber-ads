import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  LineChart,
  MessagesSquare,
  Radar,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import logo from "@/assets/glauber-ads-logo.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { MarketingScripts } from "@/components/MarketingScripts";
import { useToast } from "@/components/ui/use-toast";
import { cleanWhatsApp, validateWhatsApp, validateEmail, formatWhatsAppForLink } from "@/lib/validation";
import { checkRateLimit, recordAttempt, getAttemptsRemaining } from "@/lib/rateLimit";
import { useSettings } from "@/contexts/SettingsContext";

type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  solution: string;
  details: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const solutions = [
  "Tráfego e Performance",
  "Criativo e Conteúdo",
  "Automação e Sistemas",
  "Captação de Lead",
  "Estrutura Comercial",
  "Quero entender melhor a solução",
];

const authorityCards = [
  { title: "Growth Marketing", icon: LineChart },
  { title: "Social Ads (Meta & TikTok)", icon: Radar },
  { title: "Criativos de Performance", icon: Sparkles },
  { title: "Automação e Sistemas", icon: Bot },
  { title: "Captação e Reativação", icon: MessagesSquare },
  { title: "Estrutura Comercial", icon: BarChart3 },
];

const painPoints = [
  {
    title: "Tráfego sem estrutura",
    description: "Mais volume entrando em um processo que não converte direito.",
  },
  {
    title: "Criativos sem força",
    description: "Campanhas rodam, mas não geram clique com consistência.",
  },
  {
    title: "Base esfriando",
    description: "O lead entra e perde valor porque a operação não reage no tempo certo.",
  },
  {
    title: "Comercial desalinhado",
    description: "O time recebe contato, mas sem contexto, sem priorização e sem inteligência.",
  },
];

const solutionCards = [
  {
    title: "Tráfego e Performance",
    description: "Campanhas orientadas por funil, dados e eficiência real.",
    icon: Target,
  },
  {
    title: "Criativos e Conteúdo",
    description: "Peças pensadas para parar scroll, aumentar CTR e sustentar performance.",
    icon: Sparkles,
  },
  {
    title: "Automação e Sistemas",
    description: "Estruturas para organizar captação, atendimento, fluxo e operação.",
    icon: Bot,
  },
  {
    title: "Captação de Leads",
    description: "Mecanismos de entrada pensados para reduzir desperdício e aumentar aproveitamento.",
    icon: Zap,
  },
  {
    title: "Estrutura Comercial",
    description: "Mais velocidade, mais contexto e melhor resposta para transformar interesse em oportunidade.",
    icon: BrainCircuit,
  },
];

const stats = [
  { value: "Funil", label: "estruturado para captar, qualificar e acelerar conversão" },
  { value: "Dados", label: "como camada de decisão e otimização comercial" },
  { value: "Escala", label: "com mais controle operacional e menos desperdício" },
];

const initialState: FormState = {
  name: "",
  email: "",
  whatsapp: "",
  solution: "",
  details: "",
};

const Index = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [logoUrl, setLogoUrl] = useState<string>(logo);
  const [isOpen, setIsOpen] = useState(false);
  const [ctaContext, setCtaContext] = useState("Hero");
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxScroll, setMaxScroll] = useState(0);
  const [startTime] = useState(Date.now());

  const normalizeStoragePath = (path: string) => {
    return path.replace(/^\/+/g, "").replace(/^site-assets\//, "").replace(/^\/site-assets\//, "");
  };

  useEffect(() => {
    const resolveLogoUrl = async () => {
      const savedLogo = settings?.logo_url;
      if (!savedLogo) {
        setLogoUrl(logo);
        return;
      }

      if (/^https?:\/\//i.test(savedLogo)) {
        setLogoUrl(savedLogo);
        return;
      }

      try {
        const normalizedPath = normalizeStoragePath(savedLogo);
        const { data, error } = supabase.storage.from("site-assets").getPublicUrl(normalizedPath);

        if (error || !data?.publicUrl) {
          console.warn("[Header] Falha ao resolver logo_url via Storage:", error?.message || "URL pública não disponível", savedLogo);
          setLogoUrl(logo);
          return;
        }

        setLogoUrl(data.publicUrl);
      } catch (err) {
        console.error("[Header] Exceção ao resolver logo_url:", err);
        setLogoUrl(logo);
      } finally {
        setLogoLoading(false);
      }
    };

    resolveLogoUrl();
  }, [settings?.logo_url]);

  // Apply dashboard colors to the public homepage
  useEffect(() => {
    document.documentElement.classList.add("admin-theme", "dark");
  }, []);

  // Monitora a porcentagem máxima de scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
        setMaxScroll((prev) => Math.max(prev, scrollPercent));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Carregar dados salvos do localStorage ao abrir modal
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("glauber_form_draft");
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setForm((prev) => ({
            ...prev,
            name: draft.name || "",
            email: draft.email || "",
            whatsapp: draft.whatsapp || "",
            details: draft.details || "",
          }));
        } catch (e) {
          // Ignorar erro ao parsear
        }
      }
    }
  }, [isOpen]);

  // Salvar draft do formulário no localStorage
  const saveDraft = (updatedForm: FormState) => {
    localStorage.setItem(
      "glauber_form_draft",
      JSON.stringify({
        name: updatedForm.name,
        email: updatedForm.email,
        whatsapp: updatedForm.whatsapp,
        details: updatedForm.details,
      })
    );
  };

  const whatsappMessage = useMemo(() => {
    const base = `Olá, acabei de preencher o formulário no site da Glauber Ads. Quero falar sobre ${form.solution}.`;
    return form.details.trim() ? `${base} Minha necessidade é: ${form.details.trim()}.` : base;
  }, [form.details, form.solution]);

  const openModal = (context: string) => {
    setCtaContext(context);
    setSubmitError(null);
    setIsOpen(true);
  };

  const updateField = (field: keyof FormState, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    setErrors((current) => ({ ...current, [field]: undefined }));
    // Salvar draft
    saveDraft(updated);
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    const cleanName = form.name.trim();

    // Validar nome
    if (!cleanName || cleanName.length < 2) {
      nextErrors.name = "Informe seu nome (mín. 2 caracteres).";
    } else if (cleanName.length > 100) {
      nextErrors.name = "Nome muito longo (máx. 100 caracteres).";
    }

    // Validar email
    const emailError = validateEmail(form.email);
    if (emailError) {
      nextErrors.email = emailError;
    }

    // Validar WhatsApp
    const whatsappError = validateWhatsApp(form.whatsapp);
    if (whatsappError) {
      nextErrors.whatsapp = whatsappError;
    }

    // Validar solução
    if (!form.solution) {
      nextErrors.solution = "Selecione uma solução.";
    }

    // Validar detalhes
    if (form.details.trim().length > 280) {
      nextErrors.details = "Descrição muito longa (máx. 280 caracteres).";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    // Verificar rate limiting
    if (!checkRateLimit()) {
      setSubmitError(`Limite de envios atingido. Tente novamente em alguns minutos.`);
      toast({
        title: "Muitos envios",
        description: "Você atingiu o limite de envios. Tente novamente em alguns minutos.",
        variant: "destructive",
      });
      return;
    }

    const cleanName = form.name.trim();
    const cleanEmail = form.email.trim();
    const cleanWhatsapp = cleanWhatsApp(form.whatsapp);
    const cleanDetails = form.details.trim();
    const params = new URLSearchParams(window.location.search);

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabase.from("leads").insert({
        nome: cleanName,
        email: cleanEmail,
        whatsapp: cleanWhatsapp,
        solucao_interesse: form.solution,
        descricao_necessidade: cleanDetails || null,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        utm_content: params.get("utm_content"),
      });

      if (error) {
        throw error;
      }

      // Registrar tentativa de envio bem-sucedida
      recordAttempt();

      // Analytics Google
      const analyticsWindow = window as Window & { dataLayer?: unknown[] };
      if (Array.isArray(analyticsWindow.dataLayer)) {
        analyticsWindow.dataLayer.push({
          event: "lead_saved",
          cta_context: ctaContext,
          solution: form.solution,
        });
      }

      // Analytics Meta Pixel (Lead)
      const fbWindow = window as Window & { fbq?: any };
      if (typeof fbWindow.fbq === "function") {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        fbWindow.fbq("track", "Lead", {
          scroll_depth: maxScroll + "%",
          seconds_on_page: timeOnPage + "s",
          button_location: ctaContext,
          solution: form.solution
        });
        console.log(`[Pixel] Lead disparado: ${maxScroll}% de scroll, ${timeOnPage}s na página. Origem: ${ctaContext}`);
      }

      // Toast de sucesso
      toast({
        title: "Lead enviado com sucesso! ✓",
        description: "Você será redirecionado para o WhatsApp em instantes.",
      });

      // Limpar draft
      localStorage.removeItem("glauber_form_draft");

      // Aguardar um pouco antes de abrir WhatsApp para o usuário ver a notificação
      setTimeout(() => {
        // Usar wa.me para melhor compatibilidade
        const whatsappNumber = formatWhatsAppForLink(cleanWhatsapp);
        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(url, "_blank", "noopener,noreferrer");

        // Resetar form
        setForm(initialState);
        setErrors({});
        setIsOpen(false);
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setSubmitError(`Erro ao salvar: ${errorMsg}. Se o problema persistir, tente novamente em alguns minutos.`);
      toast({
        title: "Erro ao enviar",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingScripts />
      <div className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src={logoUrl}
              alt="Logo da Glauber Ads"
              className="h-12 w-12 object-contain"
              loading="eager"
              onError={() => {
                if (logoUrl !== logo) {
                  setLogoUrl(logo);
                }
              }}
            />
            <div>
              <p className="text-lg font-semibold">Glauber Ads</p>
              <p className="text-xs text-muted-foreground">Growth, performance e inteligência comercial</p>
            </div>
          </div>
          <Button onClick={() => openModal("Header")} className="gap-2" aria-label="Abrir formulário de contato">
            Falar com especialista
            <ArrowRight />
          </Button>
        </div>
      </div>

      <main>
        <section className="relative overflow-hidden border-b border-border/60 pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.22),transparent_35%),radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.16),transparent_30%)]" />
          <div className="relative mx-auto grid min-h-[88svh] max-w-7xl items-center gap-14 px-4 pb-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-4 py-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Operação moderna para captar, converter e escalar
              </div>

              <img
                src={logoUrl}
                alt="Identidade visual da Glauber Ads"
                className="h-24 w-auto object-contain sm:h-28"
                loading="eager"
                onError={() => {
                  if (logoUrl !== logo) {
                    setLogoUrl(logo);
                  }
                }}
              />

              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  Transformamos atenção em vendas com estratégia, tecnologia e performance.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                  A Glauber Ads une tráfego, criativos, automação e inteligência comercial para construir operações mais eficientes, previsíveis e escaláveis.
                </p>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                  Se você quer mais do que campanha bonita e precisa de estrutura para captar, converter e crescer, aqui é onde a operação começa a ficar séria.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="gap-2" onClick={() => openModal("Hero - Especialista")}>
                  Quero falar com um especialista
                  <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={() => openModal("Hero - Diagnóstico")}>
                  Quero diagnosticar minha operação
                  <ChevronRight />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.value} className="rounded-lg border border-border/70 bg-card/60 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-primary">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-lg border border-border/70 bg-card/70 p-5 shadow-2xl shadow-primary/10 backdrop-blur-xl">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-background/80 p-4">
                    <p className="text-sm text-muted-foreground">Camadas de operação</p>
                    <div className="mt-4 space-y-3">
                      {[
                        "Aquisição orientada por dados",
                        "Criativos com foco em CTR e intenção",
                        "Qualificação e resposta com contexto",
                        "Reativação e inteligência comercial",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-secondary/30 p-4">
                    <p className="text-sm text-muted-foreground">Visão estratégica</p>
                    <div className="mt-6 space-y-4">
                      <div className="rounded-md border border-border/70 bg-card/80 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Entrada</p>
                        <p className="mt-1 font-medium">Tráfego + Criativo</p>
                      </div>
                      <div className="rounded-md border border-border/70 bg-card/80 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Processo</p>
                        <p className="mt-1 font-medium">Captação + Automação</p>
                      </div>
                      <div className="rounded-md border border-border/70 bg-card/80 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultado</p>
                        <p className="mt-1 font-medium">Contexto + Conversão</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-medium text-primary">Autoridade</p>
              <h2 className="text-3xl font-semibold sm:text-4xl">Não entregamos só mídia. Construímos operações que performam.</h2>
              <p className="text-lg leading-8 text-muted-foreground">
                A maioria das empresas investe em tráfego sem corrigir os gargalos que travam crescimento. A Glauber Ads atua na estrutura completa: atração, criativo, automação, captação, reativação e eficiência comercial.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {authorityCards.map(({ title, icon: Icon }) => (
                <article key={title} className="rounded-lg border border-border/70 bg-card/60 p-6 transition-transform duration-200 hover:-translate-y-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border/70 bg-secondary/40">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="space-y-4">
              <p className="text-sm font-medium text-primary">O problema</p>
              <h2 className="text-3xl font-semibold sm:text-4xl">O problema não é só atrair. É o que acontece depois que o lead entra.</h2>
              <p className="text-lg leading-8 text-muted-foreground">
                Muitas operações crescem em volume, mas continuam perdendo eficiência em pontos invisíveis: resposta lenta, base mal aproveitada, criativos mornos, funil desorganizado e operação sem inteligência de reativação.
              </p>
              <p className="text-base leading-7 text-muted-foreground">
                Quando isso acontece, a empresa compra atenção, mas desperdiça parte do valor no meio do caminho.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {painPoints.map((item) => (
                <article key={item.title} className="rounded-lg border border-border/70 bg-card/60 p-6">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-medium text-primary">Soluções</p>
              <h2 className="text-3xl font-semibold sm:text-4xl">Soluções para destravar crescimento com inteligência operacional</h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {solutionCards.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-lg border border-border/70 bg-card/60 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border/70 bg-secondary/40">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>

            <div className="mt-10">
              <Button size="lg" onClick={() => openModal("Soluções")} className="gap-2">
                Quero entender a melhor solução para minha operação
                <ArrowRight />
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="rounded-lg border border-border/70 bg-card/50 p-8">
              <p className="text-sm font-medium text-muted-foreground">Agência comum</p>
              <ul className="mt-6 space-y-4">
                {["Sobe campanha", "Entrega relatório", "Fala de alcance e clique", "Trata mídia isoladamente"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/10 p-8">
              <p className="text-sm font-medium text-primary">Glauber Ads</p>
              <ul className="mt-6 space-y-4">
                {[
                  "Conecta tráfego, criativo, automação e comercial",
                  "Pensa eficiência do funil inteiro",
                  "Cria estrutura para escalar com mais controle",
                  "Trata marketing como motor de crescimento",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="max-w-4xl text-3xl font-semibold sm:text-4xl">A diferença entre rodar campanha e construir uma operação que escala</h2>
            <p className="mt-6 text-xl leading-8 text-muted-foreground">A gente não vende post bonito. A gente constrói estrutura para gerar resultado.</p>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-medium text-primary">Captura</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Se você quer crescer com mais controle, o próximo passo é conversar com a estratégia certa.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              Antes de abrir a conversa no WhatsApp, queremos entender rapidamente sua necessidade para direcionar você da forma certa.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={() => openModal("Captura")} className="gap-2">
                Falar com um especialista agora
                <ArrowRight />
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Atendimento mais rápido, mais direcionado e com mais contexto sobre o que sua operação precisa.
            </p>
          </div>
        </section>

        <section className="py-20 fechamento-section dark">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid-lines relative">
            <div className="rounded-xl fechamento-card px-8 py-16 text-center shadow-2xl">
              <p className="text-base font-bold uppercase tracking-widest fechamento-accent mb-2">Fechamento</p>
              <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl text-white drop-shadow-lg">
                Sua operação não precisa só de mais alcance.<br />
                <span className="text-[hsl(var(--accent-orange))] text-glow-orange">Precisa de mais inteligência</span> para transformar atenção em venda.
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-300">
                Se tráfego, criativo, automação e atendimento não trabalham juntos, o crescimento vira desperdício disfarçado.
              </p>
              <div className="mt-10 flex justify-center">
                <Button size="lg" onClick={() => openModal("Fechamento")} className="gap-2 fechamento-btn-glow text-lg px-8 py-4 font-semibold">
                  Quero falar com um especialista
                  <ArrowRight />
                </Button>
              </div>
              <p className="mt-6 text-base text-gray-400">
                Abra a conversa com contexto e receba um direcionamento mais estratégico para sua necessidade.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="border-border/70 bg-card/95 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Antes de abrir a conversa, me diga onde podemos te ajudar melhor.</DialogTitle>
            <DialogDescription className="text-base leading-7">
              Preencha seus dados para seguir para o WhatsApp com atendimento mais rápido e direcionado.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="rounded-md border border-border/70 bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              Origem do CTA: <span className="font-medium text-foreground">{ctaContext}</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nome</label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Seu nome"
                maxLength={100}
                aria-invalid={!!errors.name}
              />
              {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="seu@email.com"
                maxLength={100}
                aria-invalid={!!errors.email}
              />
              {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(event) => updateField("whatsapp", event.target.value)}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                maxLength={20}
                aria-invalid={!!errors.whatsapp}
              />
              {errors.whatsapp ? <p className="text-sm text-destructive">{errors.whatsapp}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="solution" className="text-sm font-medium">Qual solução você está buscando?</label>
              <select
                id="solution"
                value={form.solution}
                onChange={(event) => updateField("solution", event.target.value)}
                aria-invalid={!!errors.solution}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  errors.solution ? "border-destructive" : "",
                )}
              >
                <option value="">Selecione uma opção</option>
                {solutions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.solution ? <p className="text-sm text-destructive">{errors.solution}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="details" className="text-sm font-medium">Descrição breve da sua necessidade</label>
              <textarea
                id="details"
                value={form.details}
                onChange={(event) => updateField("details", event.target.value)}
                placeholder="Conte rapidamente o momento da sua operação"
                maxLength={280}
                rows={5}
                aria-invalid={!!errors.details}
                className={cn(
                  "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  errors.details ? "border-destructive" : "",
                )}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Seus dados serão usados apenas para agilizar seu atendimento.</span>
                <span>{form.details.length}/280</span>
              </div>
              {errors.details ? <p className="text-sm text-destructive">{errors.details}</p> : null}
            </div>

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

            <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
              {isSubmitting ? "Salvando lead..." : "Continuar para o WhatsApp"}
              <ArrowRight />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
