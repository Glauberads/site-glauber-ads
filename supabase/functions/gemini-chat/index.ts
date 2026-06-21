import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações do CORS para aceitar requisições do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_SYSTEM_PROMPT = `Você é o assistente virtual da Glauber Ads, uma agência especializada em tráfego pago, criativos, automação, sites, landing pages e estratégias digitais.

Sua função é conversar com visitantes da landing page, entender a necessidade do negócio e qualificar oportunidades comerciais.

Tom de voz:
- Direto
- Consultivo
- Profissional
- Simples
- Objetivo
- Educativo

Regras:
- Faça perguntas para entender o cenário do visitante.
- Ajude a identificar gargalos de marketing e vendas.
- Nunca invente informações.
- Nunca prometa resultados garantidos.
- Nunca informe preços que não estejam oficialmente cadastrados.
- Nunca diga que é humano.
- Evite respostas excessivamente longas.
- Priorize conversas curtas e produtivas.
- Até 4 frases curtas por resposta.

Principais dores que você deve identificar:
- Falta de clientes
- Baixa geração de leads
- Campanhas sem resultado
- Criativos fracos
- Falta de automação
- Ausência de site ou landing page
- Baixa conversão de anúncios
- Dependência excessiva de indicação
- Dificuldade em vender pelo WhatsApp

Informações que devem ser coletadas naturalmente:
1. Nome
2. WhatsApp
3. Tipo de negócio
4. Principal dificuldade
5. Se já anuncia atualmente
6. Nível de urgência

IMPORTANTE: Você atua como um SDR Digital. Ao longo da conversa, tente coletar esses dados de forma amigável.
Quando você tiver capturado as informações principais ou identificar uma intenção comercial clara (o cliente está interessado e forneceu contato e informações), você DEVE incluir no FINAL da sua resposta, um bloco JSON oculto para registrar no sistema. O formato do JSON DEVE ser EXATAMENTE assim:
\`\`\`json
{"action": "qualify_lead", "data": {"name": "Nome", "whatsapp": "WhatsApp", "business_type": "Ramo do negócio", "pain_point": "Principal dor resumida", "intent_score": 90, "conversation_summary": "Resumo da conversa"}}
\`\`\`
Onde intent_score é um número inteiro de 0 a 100 indicando a temperatura comercial da oportunidade (acima de 80 é quente). No texto normal da resposta, avise o usuário que você anotou as informações e convide-o para o WhatsApp ou formulário para dar o próximo passo (botões aparecerão para ele).`;

serve(async (req) => {
  // Lida com a requisição de pré-vôo (preflight) CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, utms } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY não configurada nas variáveis de ambiente do Supabase.')
    }

    // Usar o endpoint da API REST do Gemini (1.5 Flash para conversas rápidas)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
    
    // Mapeia o array de mensagens do frontend para a estrutura exigida pelo Gemini
    // Frontend envia: { role: 'user' | 'assistant', content: string }
    const geminiMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    // Conectar ao Supabase contornando o RLS com service_role para buscar as configurações
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    let activeSystemPrompt = DEFAULT_SYSTEM_PROMPT;

    if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const { data: settingsData } = await supabase
            .from('site_settings')
            .select('ai_system_prompt')
            .limit(1)
            .single()
            
        if (settingsData && settingsData.ai_system_prompt) {
            activeSystemPrompt = settingsData.ai_system_prompt;
        }

        // Lógica de Respostas Rápidas
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        const normalizedMessage = lastUserMessage.toLowerCase();

        const { data: quickResponses } = await supabase
            .from('ai_quick_responses')
            .select('id, title, keywords, response')
            .eq('is_active', true)
            .order('priority', { ascending: false });

        let matchedQuickResponse = null;
        if (quickResponses && normalizedMessage) {
            for (const qr of quickResponses) {
                const keywords = qr.keywords || [];
                const hasMatch = keywords.some((kw: string) => 
                    normalizedMessage.includes(kw.toLowerCase())
                );
                if (hasMatch) {
                    matchedQuickResponse = qr;
                    break;
                }
            }
        }

        if (matchedQuickResponse) {
            // Salvar log de Quick Response
            const { error: logError } = await supabase.from('ai_chat_logs').insert({
                user_message: lastUserMessage,
                bot_response: matchedQuickResponse.response,
                response_source: 'quick_response',
                matched_quick_response_id: matchedQuickResponse.id,
                matched_quick_response_title: matchedQuickResponse.title,
                utm_source: utms?.utm_source || null,
                utm_medium: utms?.utm_medium || null,
                utm_campaign: utms?.utm_campaign || null,
            });

            if (logError) console.error("Erro ao salvar log de quick_response:", logError);

            return new Response(JSON.stringify({ 
                reply: matchedQuickResponse.response,
                isQualified: false 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    }

    const body = {
      systemInstruction: {
        role: "system",
        parts: [{ text: activeSystemPrompt }]
      },
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      }
    }

    // Faz a chamada externa para o Gemini
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao comunicar com a API do Gemini.')
    }

    let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar a resposta agora."

    // Lógica para interceptar o comando do SDR (Function Calling via JSON)
    let actionData = null;
    let isQualified = false;
    
    // Regex para pegar qualquer bloco JSON
    const jsonMatch = replyText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.action === 'qualify_lead') {
                actionData = parsed.data;
                isQualified = true;
                
                // Remove o bloco JSON da resposta que será exibida ao usuário
                replyText = replyText.replace(/```json\n[\s\S]*?\n```/, '').trim();
                
                // Conectar ao Supabase contornando o RLS com service_role
                const supabaseUrl = Deno.env.get('SUPABASE_URL')
                const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
                
                if (supabaseUrl && supabaseServiceKey) {
                    const supabase = createClient(supabaseUrl, supabaseServiceKey)
                    
                    // Salvar o lead qualificado no banco
                    const { error } = await supabase.from('ai_chat_leads').insert({
                        name: actionData.name || null,
                        whatsapp: actionData.whatsapp || null,
                        business_type: actionData.business_type || null,
                        pain_point: actionData.pain_point || null,
                        intent_score: actionData.intent_score || 0,
                        conversation_summary: actionData.conversation_summary || null,
                        utm_source: utms?.utm_source || null,
                        utm_medium: utms?.utm_medium || null,
                        utm_campaign: utms?.utm_campaign || null,
                    })
                    
                    if (error) {
                        console.error("Erro ao salvar lead de IA no banco ai_chat_leads:", error)
                    } else {
                        console.log("Lead SDR salvo com sucesso:", actionData.name)
                        
                        // Salvar simultaneamente na tabela principal 'leads' caso tenha nome e telefone
                        if (actionData.name && actionData.whatsapp) {
                            const { error: leadsError } = await supabase.from('leads').insert({
                                nome: actionData.name,
                                whatsapp: actionData.whatsapp,
                                solucao_interesse: actionData.business_type || 'Agente IA SDR',
                                descricao_necessidade: actionData.pain_point || actionData.conversation_summary || 'Lead gerado via Inteligência Artificial.',
                                utm_source: utms?.utm_source || 'AI_Agent',
                                utm_medium: utms?.utm_medium || null,
                                utm_campaign: utms?.utm_campaign || null,
                            });
                            
                            if (leadsError) {
                                console.error("Erro ao salvar lead na tabela principal (leads):", leadsError);
                            } else {
                                console.log("Lead SDR também adicionado no CRM principal.");
                            }
                        }
                    }
                } else {
                    console.error("Credenciais do Supabase ausentes no env.")
                }
            }
        } catch(e) {
            console.error("Falha ao realizar parse do JSON emitido pela IA:", e);
        }
    }

    // Salvar log da resposta do Gemini
    const lastUserMessageGemini = messages[messages.length - 1]?.content || '';
    const supabaseUrlLogs = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKeyLogs = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (supabaseUrlLogs && supabaseServiceKeyLogs) {
        const supabaseLogs = createClient(supabaseUrlLogs, supabaseServiceKeyLogs);
        const { error: logErrorGemini } = await supabaseLogs.from('ai_chat_logs').insert({
            user_message: lastUserMessageGemini,
            bot_response: replyText,
            response_source: 'gemini',
            utm_source: utms?.utm_source || null,
            utm_medium: utms?.utm_medium || null,
            utm_campaign: utms?.utm_campaign || null,
        });
        if (logErrorGemini) console.error("Erro ao salvar log do gemini:", logErrorGemini);
    }

    // Retorna a resposta para o frontend
    return new Response(JSON.stringify({ 
        reply: replyText,
        isQualified: isQualified 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("Error Function gemini-chat:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
