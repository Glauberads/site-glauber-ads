import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
import heroBg from "@/assets/hero-bg.png";
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
import { cleanWhatsApp, validateWhatsApp, formatWhatsAppForLink } from "@/lib/validation";
import { checkRateLimit, recordAttempt, getAttemptsRemaining } from "@/lib/rateLimit";
import { useSettings } from "@/contexts/SettingsContext";

type FormState = {
  name: string;
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
  { 
    title: "Growth Marketing", 
    description: "Estratégia orientada a crescimento, eficiência e escala.",
    icon: LineChart 
  },
  { 
    title: "Social Ads (Meta & TikTok)", 
    description: "Campanhas pensadas para gerar atenção, clique e resultado.",
    icon: Radar 
  },
  { 
    title: "Criativos de Performance", 
    description: "Peças criadas para parar o scroll e sustentar CTR.",
    icon: Sparkles 
  },
  { 
    title: "Automação e Sistemas", 
    description: "Mais controle, velocidade e inteligência na operação.",
    icon: Bot 
  },
  { 
    title: "Captação e Reativação", 
    description: "Estruturas para atrair, recuperar e aproveitar melhor cada oportunidade.",
    icon: MessagesSquare 
  },
  { 
    title: "Estrutura Comercial", 
    description: "Processos mais organizados para transformar demanda em venda.",
    icon: BarChart3 
  },
];

const painPoints = [
  {
    title: "Tráfego sem estrutura",
    description: "Tráfego sem estrutura desperdiça orçamento. Mais volume entrando em um processo que não converte direito.",
  },
  {
    title: "Criativos sem força",
    description: "Criativos mornos derrubam eficiência. Campanhas rodam, mas não sustentam resultado nem geram clique com consistência.",
  },
  {
    title: "Base esfriando",
    description: "Leads esfriam quando a operação responde tarde. O lead entra e perde valor porque não há velocidade no atendimento.",
  },
  {
    title: "Comercial desalinhado",
    description: "Marketing isolado não escala operação. O time recebe contato sem contexto, sem priorização e sem inteligência comercial.",
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
  whatsapp: "",
  solution: "",
  details: "",
};

const Index = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

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
    const savedLogo = settings?.logo_url;
    if (!savedLogo) {
      setLogoUrl(logo);
      return;
    }

    if (/^https?:\/\//i.test(savedLogo)) {
      setLogoUrl(savedLogo);
      return;
    }

    const normalizedPath = normalizeStoragePath(savedLogo);
    const { data } = supabase.storage.from("site-assets").getPublicUrl(normalizedPath);

    if (data?.publicUrl) {
      setLogoUrl(data.publicUrl);
    } else {
      setLogoUrl(logo);
    }
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
    const cleanWhatsapp = cleanWhatsApp(form.whatsapp);
    const cleanDetails = form.details.trim();
    const params = new URLSearchParams(window.location.search);

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabase.from("leads").insert({
        nome: cleanName,
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
      const fbWindow = window as Window & { fbq?: (event: string, name: string, params?: Record<string, unknown>) => void };
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
      <div className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={logoUrl}
              alt="Logo da Glauber Ads"
              className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
              loading="eager"
              onError={() => {
                if (logoUrl !== logo) {
                  setLogoUrl(logo);
                }
              }}
            />
            <div>
              <p className="text-base font-semibold leading-tight sm:text-lg">Glauber Ads</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Growth, performance e inteligência comercial</p>
            </div>
          </div>
          <Button size="sm" onClick={() => openModal("Header")} className="h-9 gap-1.5 px-4 text-[13px] sm:h-10 sm:gap-2 sm:px-5 sm:text-sm" aria-label="Abrir formulário de contato">
            <span className="hidden sm:inline">Diagnosticar operação</span>
            <span className="sm:hidden">Diagnosticar</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      <main>
        <section className="relative overflow-hidden border-b border-border/60 pt-28">
          {/* Background Image Layer */}
          <div 
            className="absolute inset-0 z-0 opacity-40 mix-blend-screen"
            style={{
              backgroundImage: `url(${settings?.hero_bg_url || heroBg})`,
              backgroundPosition: 'right center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              maskImage: 'linear-gradient(to right, transparent 0%, black 50%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 50%)'
            }}
          />
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.22),transparent_35%),radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.16),transparent_30%)]" />
          <div className="relative z-10 mx-auto grid min-h-[88svh] max-w-7xl items-center gap-14 px-4 pb-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
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
                  Atrair leads não basta. Sua operação precisa converter com contexto, velocidade e estrutura.
                </h1>
                <div className="rounded-xl bg-black/30 p-4 -ml-4 backdrop-blur-md">
                  <p className="max-w-3xl text-lg leading-8 text-gray-200">
                    A Glauber Ads conecta tráfego, criativo, automação e inteligência comercial para reduzir desperdício e escalar resultado com mais controle.
                  </p>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-gray-400">
                    Descubra onde sua operação está perdendo eficiência e qual é o próximo passo para crescer com mais controle.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="gap-2 fechamento-btn-glow px-8 py-6 text-base font-semibold" onClick={() => openModal("Hero - Diagnóstico")}>
                  Quero diagnosticar minha operação
                  <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-base" onClick={() => openModal("Hero - Especialista")}>
                  Quero falar com um especialista
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
              <div className="rounded-lg border border-border/70 bg-background/80 p-5 shadow-2xl shadow-primary/10 backdrop-blur-3xl">
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

            <motion.div 
              className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {authorityCards.map(({ title, description, icon: Icon }) => (
                <motion.article 
                  key={title} 
                  variants={itemVariants}
                  className="group relative rounded-xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:shadow-primary/5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-br from-secondary/50 to-background/50 shadow-inner transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-secondary/60">
                    <Icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
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

            <motion.div 
              className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {solutionCards.map(({ title, description, icon: Icon }) => (
                <motion.article 
                  key={title} 
                  variants={itemVariants}
                  className="group relative rounded-xl border border-border/40 bg-gradient-to-b from-card/80 to-card/40 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:shadow-primary/5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-br from-secondary/50 to-background/50 shadow-inner transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-secondary/60">
                    <Icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            <div className="mt-10">
              <Button size="lg" onClick={() => openModal("Soluções - Diagnóstico")} className="gap-2">
                Quero diagnosticar minha operação
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
            <p className="text-sm font-medium text-primary">Diagnóstico</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Se você quer crescer com mais controle, o próximo passo é descobrir onde sua operação está travando resultado.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              Antes de abrir a conversa no WhatsApp, queremos entender rapidamente sua necessidade para direcionar você com mais precisão.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => openModal("Captura - Diagnóstico")} className="gap-2">
                Quero diagnosticar minha operação
                <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" onClick={() => openModal("Captura - Especialista")} className="gap-2">
                Quero falar com um especialista
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Atendimento mais rápido, mais direcionado e com mais contexto sobre o que sua operação realmente precisa.
            </p>
          </div>
        </section>

        <section className="border-b border-border/60 py-20 bg-secondary/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-medium text-primary">Resultados</p>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Quando marketing e operação trabalham juntos, o crescimento deixa de depender de improviso.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border/70 bg-card/60 p-6 text-center shadow-sm">
                <p className="text-lg font-semibold text-foreground">Mais velocidade</p>
                <p className="mt-2 text-sm text-muted-foreground">na resposta ao lead</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-card/60 p-6 text-center shadow-sm">
                <p className="text-lg font-semibold text-foreground">Mais contexto</p>
                <p className="mt-2 text-sm text-muted-foreground">no atendimento comercial</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-card/60 p-6 text-center shadow-sm">
                <p className="text-lg font-semibold text-foreground">Menos desperdício</p>
                <p className="mt-2 text-sm text-muted-foreground">nas etapas do funil</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-card/60 p-6 text-center shadow-sm">
                <p className="text-lg font-semibold text-foreground">Mais controle</p>
                <p className="mt-2 text-sm text-muted-foreground">para escalar com eficiência</p>
              </div>
            </div>
            
            {/* Espaço preparado para depoimentos ou prints de resultado futuros */}
            <div className="mt-12 hidden">
              <div className="rounded-xl border border-border/70 bg-card/40 p-8 text-center">
                <p className="text-sm text-muted-foreground">[Espaço reservado para Mini Case ou Depoimento]</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 fechamento-section dark">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid-lines relative">
            <div className="rounded-xl fechamento-card px-8 py-16 text-center shadow-2xl">
              <p className="text-base font-bold uppercase tracking-widest fechamento-accent mb-2">Próximo Passo</p>
              <h2 className="mt-4 text-4xl font-extrabold sm:text-5xl text-white drop-shadow-lg leading-tight">
                Sua operação não precisa só de mais alcance.<br />
                <span className="text-[hsl(var(--accent-orange))] text-glow-orange">Precisa de estrutura</span> para transformar atenção em oportunidade e oportunidade em venda.
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-300">
                Quando tráfego, criativo, automação e atendimento não trabalham juntos, parte do crescimento se perde no caminho.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" onClick={() => openModal("Fechamento - Diagnóstico")} className="gap-2 fechamento-btn-glow text-lg px-8 py-4 font-semibold">
                  Quero diagnosticar minha operação
                  <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" onClick={() => openModal("Fechamento - Especialista")} className="gap-2 text-lg px-8 py-4 font-semibold border-white/20 text-white hover:bg-white/10 hover:text-white">
                  Quero falar com um especialista
                </Button>
              </div>
              <p className="mt-6 text-base text-gray-400">
                Abra a conversa com mais contexto e receba um direcionamento estratégico para destravar sua operação.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="border-border/70 bg-card/95 sm:max-w-md p-5 sm:p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl sm:text-2xl">Antes de continuar, preencha seus dados.</DialogTitle>
            <DialogDescription className="text-sm sm:text-base leading-snug">
              Preencha os dados para continuar no WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-3 sm:space-y-4 mt-1" onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="ctaContext" value={ctaContext} />

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground/90">Nome</label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Seu nome"
                maxLength={100}
                aria-invalid={!!errors.name}
                className="h-11 sm:h-10 bg-background/50"
              />
              {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
            </div>



            <div className="space-y-1.5">
              <label htmlFor="whatsapp" className="text-sm font-medium text-foreground/90">WhatsApp</label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(event) => updateField("whatsapp", event.target.value)}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                maxLength={20}
                aria-invalid={!!errors.whatsapp}
                className="h-11 sm:h-10 bg-background/50"
              />
              {errors.whatsapp ? <p className="text-xs text-destructive">{errors.whatsapp}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="solution" className="text-sm font-medium text-foreground/90">Qual solução você está buscando?</label>
              <select
                id="solution"
                value={form.solution}
                onChange={(event) => updateField("solution", event.target.value)}
                aria-invalid={!!errors.solution}
                className={cn(
                  "flex h-11 sm:h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
              {errors.solution ? <p className="text-xs text-destructive">{errors.solution}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="details" className="text-sm font-medium text-foreground/90">Descrição breve da sua necessidade <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <textarea
                id="details"
                value={form.details}
                onChange={(event) => updateField("details", event.target.value)}
                placeholder="Descreva rapidamente o que você precisa"
                maxLength={280}
                rows={2}
                aria-invalid={!!errors.details}
                className={cn(
                  "flex min-h-[60px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  errors.details ? "border-destructive" : "",
                )}
              />
              <div className="flex items-center justify-end text-[10px] text-muted-foreground">
                <span>{form.details.length}/280</span>
              </div>
              {errors.details ? <p className="text-xs text-destructive">{errors.details}</p> : null}
            </div>

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

            <div className="pt-1">
              <Button type="submit" size="lg" className="w-full gap-2 h-12 sm:h-14 text-base font-semibold fechamento-btn-glow" disabled={isSubmitting}>
                {isSubmitting ? "Salvando lead..." : "Continuar para o WhatsApp"}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;