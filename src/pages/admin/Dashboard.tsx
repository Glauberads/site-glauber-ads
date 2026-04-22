import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/admin/CountUp";
import { supabase } from "@/integrations/supabase/client";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Lead = { created_at: string };

const Dashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    supabase.from("leads").select("created_at").order("created_at", { ascending: true }).then(({ data }) => {
      setLeads(data ?? []);
    });
  }, []);

  const total = leads.length;
  const last7 = useMemo(() => {
    const days: { day: string; total: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: key.slice(5), total: 0 });
    }
    leads.forEach((l) => {
      const key = l.created_at.slice(5, 10);
      const item = days.find((x) => x.day === key);
      if (item) item.total += 1;
    });
    return days;
  }, [leads]);

  const conversion = total === 0 ? 0 : Math.min(100, (total / Math.max(total, 100)) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral em tempo real da operação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/70 glow-orange">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Número de Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neon-orange text-glow-orange tabular-nums">
              <CountUp to={total} />
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70 glow-blue">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neon-blue text-glow-blue tabular-nums">
              <CountUp to={conversion} decimals={1} suffix="%" />
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Leads (7 dias)</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neon-orange text-glow-orange tabular-nums">
              <CountUp to={last7.reduce((s, d) => s + d.total, 0)} />
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Captura de leads · 7 dias</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--neon-orange))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;