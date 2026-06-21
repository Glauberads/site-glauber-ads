import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Plus, Search, Edit, Trash2, Copy, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type AIQuickResponse = {
  id: string;
  title: string;
  keywords: string[];
  response: string;
  priority: number;
  is_active: boolean;
  created_at: string;
};

const AIQuickResponses = () => {
  const [responses, setResponses] = useState<AIQuickResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<AIQuickResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formResponse, setFormResponse] = useState("");
  const [formPriority, setFormPriority] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    fetchResponses();
  }, []);

  useEffect(() => {
    let filtered = responses;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = responses.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.keywords.some(k => k.toLowerCase().includes(lower))
      );
    }
    setFilteredResponses(filtered);
  }, [searchTerm, responses]);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_quick_responses")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResponses(data || []);
      setFilteredResponses(data || []);
    } catch (error) {
      console.error("Erro ao buscar respostas:", error);
      toast.error("Erro ao carregar respostas rápidas.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormId(null);
    setFormTitle("");
    setFormKeywords("");
    setFormResponse("");
    setFormPriority(1);
    setFormIsActive(true);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: AIQuickResponse) => {
    setFormId(item.id);
    setFormTitle(item.title);
    setFormKeywords(item.keywords.join("\n"));
    setFormResponse(item.response);
    setFormPriority(item.priority);
    setFormIsActive(item.is_active);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (item: AIQuickResponse) => {
    if (!window.confirm("Deseja duplicar esta resposta?")) return;
    try {
      const { error } = await supabase.from("ai_quick_responses").insert({
        title: item.title + " (Cópia)",
        keywords: item.keywords,
        response: item.response,
        priority: item.priority,
        is_active: false // Duplica inativo por segurança
      });
      if (error) throw error;
      toast.success("Resposta duplicada com sucesso!");
      fetchResponses();
    } catch (error) {
      console.error("Erro ao duplicar:", error);
      toast.error("Erro ao duplicar resposta.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta resposta?")) return;
    try {
      const { error } = await supabase.from("ai_quick_responses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Excluído com sucesso!");
      fetchResponses();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir resposta.");
    }
  };

  const toggleStatus = async (item: AIQuickResponse) => {
    try {
      const { error } = await supabase
        .from("ai_quick_responses")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(item.is_active ? "Desativado" : "Ativado com sucesso!");
      fetchResponses();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const keywordsArray = formKeywords
        .split("\n")
        .map(k => k.trim())
        .filter(k => k.length > 0);
        
      if (keywordsArray.length === 0) {
        toast.error("Adicione pelo menos uma palavra-chave.");
        setSaving(false);
        return;
      }
      
      const payload = {
        title: formTitle,
        keywords: keywordsArray,
        response: formResponse,
        priority: formPriority,
        is_active: formIsActive
      };

      if (formId) {
        const { error } = await supabase
          .from("ai_quick_responses")
          .update(payload)
          .eq("id", formId);
        if (error) throw error;
        toast.success("Atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("ai_quick_responses")
          .insert(payload);
        if (error) throw error;
        toast.success("Criado com sucesso!");
      }

      setIsModalOpen(false);
      fetchResponses();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar os dados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Respostas Rápidas IA</h1>
          <p className="text-muted-foreground">
            Gerencie atalhos de palavras-chave para respostas imediatas.
          </p>
        </div>
        <Button onClick={openNewModal} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Nova Resposta
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card p-2 shadow-sm max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Buscar por título ou palavra-chave..."
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
                <TableHead>Status</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Palavras-chave</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredResponses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhuma resposta rápida cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredResponses.map((item) => (
                  <TableRow key={item.id} className={!item.is_active ? "opacity-60 bg-muted/20" : ""}>
                    <TableCell>
                      <Switch 
                        checked={item.is_active} 
                        onCheckedChange={() => toggleStatus(item)} 
                      />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {item.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {item.keywords.slice(0, 3).map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {kw}
                          </Badge>
                        ))}
                        {item.keywords.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{item.keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} title="Editar">
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(item)} title="Duplicar">
                          <Copy className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} title="Excluir">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-500" />
                {formId ? "Editar Resposta Rápida" : "Nova Resposta Rápida"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título Interno</Label>
                <Input 
                  placeholder="Ex: Grupo Projeto Jovem" 
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Palavras-chave (Uma por linha)</Label>
                <Textarea 
                  placeholder="projeto jovem&#10;grupo projeto jovem&#10;link projeto jovem" 
                  className="min-h-[100px] text-sm font-mono"
                  value={formKeywords}
                  onChange={e => setFormKeywords(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Se o usuário digitar qualquer uma dessas palavras na frase, o Agente enviará a resposta instantaneamente.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Resposta (Conteúdo que será enviado)</Label>
                <Textarea 
                  placeholder="Você pode entrar no grupo através deste link: https://..." 
                  className="min-h-[150px] text-sm"
                  value={formResponse}
                  onChange={e => setFormResponse(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade (Maior = Verifica primeiro)</Label>
                  <Input 
                    type="number" 
                    value={formPriority}
                    onChange={e => setFormPriority(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <Label>Ativar Resposta?</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      checked={formIsActive} 
                      onCheckedChange={setFormIsActive} 
                    />
                    <span className="text-sm text-muted-foreground">
                      {formIsActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Resposta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIQuickResponses;
