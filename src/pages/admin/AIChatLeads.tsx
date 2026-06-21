import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Download, Bot, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type AIChatLead = {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string;
  business_type: string | null;
  pain_point: string | null;
  intent_score: number;
  conversation_summary: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
};

const AIChatLeads = () => {
  const [leads, setLeads] = useState<AIChatLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<AIChatLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<AIChatLead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let filtered = leads;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = leads.filter(
        (l) =>
          (l.name && l.name.toLowerCase().includes(lower)) ||
          (l.whatsapp && l.whatsapp.includes(lower)) ||
          (l.utm_source && l.utm_source.toLowerCase().includes(lower))
      );
    }
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_chat_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!filteredLeads.length) return;
    
    const headers = [
      "Data",
      "Nome",
      "WhatsApp",
      "Tipo Negócio",
      "Dor",
      "Score",
      "Origem",
      "Resumo",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredLeads.map((lead) =>
        [
          format(new Date(lead.created_at), "dd/MM/yyyy HH:mm"),
          `"${lead.name || ""}"`,
          lead.whatsapp || "",
          `"${lead.business_type || ""}"`,
          `"${lead.pain_point || ""}"`,
          lead.intent_score,
          lead.utm_source || "Orgânico",
          `"${(lead.conversation_summary || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ai-conversas-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversas IA</h1>
          <p className="text-muted-foreground">
            Leads qualificados automaticamente pelo SDR Digital (Gemini).
          </p>
        </div>
        <Button onClick={downloadCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card p-2 shadow-sm max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Buscar por nome, zap ou origem..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Negócio</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Origem (UTM)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Carregando conversas...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma conversa encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{lead.name || "Sem Nome"}</p>
                      <p className="text-xs text-muted-foreground">{lead.whatsapp}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{lead.business_type || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={lead.intent_score > 80 ? "default" : "secondary"}
                        className={lead.intent_score > 80 ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {lead.intent_score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {lead.utm_source || "Orgânico"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLead(lead)}
                        className="gap-2"
                      >
                        <Bot className="h-4 w-4" />
                        Resumo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Resumo da Qualificação
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary/30 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedLead.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{selectedLead.whatsapp}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <Badge variant={selectedLead.intent_score > 80 ? "default" : "secondary"}>
                    {selectedLead.intent_score}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Negócio</p>
                  <p className="font-medium text-sm">{selectedLead.business_type || "-"}</p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-foreground">Principal Dor</p>
                <div className="rounded-md border border-border/50 bg-background p-3 text-sm text-muted-foreground">
                  {selectedLead.pain_point || "Não identificada"}
                </div>
              </div>

              <div>
                <p className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  SDR Notes (Resumo da Conversa)
                </p>
                <div className="rounded-md border border-border/50 bg-background p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {selectedLead.conversation_summary || "Sem resumo gerado."}
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  className="w-full gap-2" 
                  onClick={() => window.open(`https://wa.me/55${selectedLead.whatsapp.replace(/\D/g, '')}`, '_blank')}
                >
                  Continuar atendimento via WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIChatLeads;
