import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Lead = {
  id: string;
  nome: string;
  whatsapp: string;
  solucao_interesse: string | null;
  descricao_necessidade: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  created_at: string;
};

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setLeads((data as Lead[]) ?? []);
        setLoading(false);
      });
  }, []);

  const exportCsv = () => {
    if (!leads.length) {
      toast.info("Nenhum lead para exportar.");
      return;
    }
    const headers = Object.keys(leads[0]);
    const rows = leads.map((l) =>
      headers
        .map((h) => {
          const value = (l as Record<string, unknown>)[h];
          const safe = value == null ? "" : String(value).replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestão de Leads</h1>
          <p className="text-sm text-muted-foreground">Todos os leads capturados pela landing page.</p>
        </div>
        <Button onClick={exportCsv} className="gap-2 glow-green">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>{loading ? "Carregando..." : `${leads.length} leads`}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Solução</TableHead>
                <TableHead>Necessidade</TableHead>
                <TableHead>UTM Source</TableHead>
                <TableHead>UTM Campaign</TableHead>
                <TableHead>Criado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell>{l.whatsapp}</TableCell>
                  <TableCell>{l.solucao_interesse}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{l.descricao_necessidade}</TableCell>
                  <TableCell>{l.utm_source ?? "—"}</TableCell>
                  <TableCell>{l.utm_campaign ?? "—"}</TableCell>
                  <TableCell>{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
              {!loading && leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Nenhum lead capturado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leads;