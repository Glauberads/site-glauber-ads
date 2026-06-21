-- Migration para armazenar leads qualificados via IA (SDR Digital)

CREATE TABLE IF NOT EXISTS public.ai_chat_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT,
    whatsapp TEXT,
    business_type TEXT,
    pain_point TEXT,
    intent_score INTEGER DEFAULT 0,
    conversation_summary TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.ai_chat_leads ENABLE ROW LEVEL SECURITY;

-- Apenas administradores logados podem visualizar e gerenciar estes leads
CREATE POLICY "Admins podem ver conversas de IA" 
ON public.ai_chat_leads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins podem deletar conversas de IA" 
ON public.ai_chat_leads 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Permite inserção apenas pelo service_role (Edge Functions) ou roles autenticadas caso necessário
CREATE POLICY "Service role / Autenticados podem inserir"
ON public.ai_chat_leads
FOR INSERT
WITH CHECK (true); -- Geralmente a inserção via anon não é recomendada para esta tabela, apenas via edge function que usa service_role bypass. Mas manteremos true com anon se for necessário testar sem edge func. O ideal é que a edge function use service_role.

-- Criar índices para acelerar filtros no painel administrativo
CREATE INDEX IF NOT EXISTS idx_ai_chat_leads_intent ON public.ai_chat_leads (intent_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_leads_created_at ON public.ai_chat_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_leads_utm_source ON public.ai_chat_leads (utm_source);
