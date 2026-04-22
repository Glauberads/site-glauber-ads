import { useEffect, useState } from "react";
import { Plus, Trash2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Webhook = { id: string; name: string; method: string; url: string; active: boolean };
type Log = { id: string; webhook_id: string | null; method: string | null; status_code: number | null; response_size: number | null; created_at: string };

const Integrations = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [name, setName] = useState("");
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("");

  const load = async () => {
    const [{ data: hooks }, { data: hookLogs }] = await Promise.all([
      supabase.from("webhooks").select("*").order("created_at", { ascending: false }),
      supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setWebhooks((hooks as Webhook[]) ?? []);
    setLogs((hookLogs as Log[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const addWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    const { error } = await supabase.from("webhooks").insert({ name, method, url });
    if (error) return toast.error(error.message);
    toast.success("Webhook adicionado.");
    setName(""); setUrl("");
    load();
  };

  const removeWebhook = async (id: string) => {
    const { error } = await supabase.from("webhooks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const testWebhook = async (hook: Webhook) => {
    try {
      const res = await fetch(hook.url, {
        method: hook.method,
        headers: { "Content-Type": "application/json" },
        body: hook.method === "GET" ? undefined : JSON.stringify({ test: true, source: "glauber-ads-admin" }),
      });
      await supabase.from("webhook_logs").insert({
        webhook_id: hook.id,
        method: hook.method,
        status_code: res.status,
        response_size: Number(res.headers.get("content-length") ?? 0),
        payload: { test: true },
      });
      toast.success(`Resposta ${res.status}`);
      load();
    } catch (err) {
      toast.error("Falha ao chamar webhook");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrações</h1>
        <p className="text-sm text-muted-foreground">Configure endpoints de webhook para POST e GET.</p>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Novo webhook</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addWebhook} className="grid gap-4 md:grid-cols-[1fr_140px_2fr_auto]">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: CRM" />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="gap-2 glow-green"><Plus className="h-4 w-4" />Adicionar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70">
        <CardHeader><CardTitle>Webhooks configurados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {webhooks.length === 0 && <p className="text-sm text-muted-foreground">Nenhum webhook ainda.</p>}
          {webhooks.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{h.name} <span className="text-xs text-neon-blue">{h.method}</span></p>
                <p className="text-xs text-muted-foreground truncate max-w-[480px]">{h.url}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => testWebhook(h)} className="gap-1"><Send className="h-3.5 w-3.5" />Testar</Button>
                <Button variant="ghost" size="icon" onClick={() => removeWebhook(h.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70">
        <CardHeader><CardTitle>Logs recentes</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem logs ainda.</p>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {logs.map((l) => (
                <div key={l.id} className="flex justify-between border-b border-border/40 py-1.5">
                  <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                  <span>{l.method}</span>
                  <span className={l.status_code && l.status_code < 400 ? "text-neon-green" : "text-destructive"}>{l.status_code ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Integrations;