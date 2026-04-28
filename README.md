# Glauber Ads (OmniVendas)

Plataforma premium da Glauber Ads com foco em conversão, captura estruturada de leads, gestão administrativa e redirecionamento inteligente para WhatsApp.

## Visão geral

O projeto atua como o motor de aquisição e gestão comercial da Glauber Ads. Além de ser uma landing page de alta conversão, conta com um painel administrativo completo para gerir leads, personalizar a marca e administrar o rastreamento de marketing.

### Objetivos principais

- Apresentar posicionamento e autoridade da marca.
- Conduzir o usuário por uma narrativa de conversão.
- Capturar leads por modal inteligente e enviar para o banco de dados.
- Rastrear nativamente eventos de Lead (Meta Pixel e GTM) com métricas avançadas (scroll, tempo).
- Oferecer um painel administrativo seguro para gestão e customização em tempo real.

## Funcionalidades implementadas

- **Landing Page:** Visual premium dark, seções de autoridade, e modal de captura.
- **Rastreamento Avançado:** Injeção nativa de Meta Pixel e Google Tags. Disparo de evento "Lead" acoplado ao formulário com `scroll_depth` e `seconds_on_page`. Captura de parâmetros UTM.
- **Painel Administrativo:**
  - **Gestão de Leads:** Visualização em tabela e exportação de CSV (com UTMs).
  - **Personalização:** Upload dinâmico de Logo e Favicon via Supabase Storage.
  - **Marketing:** Configuração de IDs de rastreamento (Pixel, GTM) direto no painel.
- **Segurança (RLS):** Banco de dados 100% protegido com regras de Row Level Security e sistema de papéis (`user_roles`).

## Estrutura principal

- `src/pages/Index.tsx`: Landing page, formulários e integração nativa com rastreadores.
- `src/pages/admin/`: Páginas do painel de controle (Leads, Marketing, Personalização).
- `src/contexts/SettingsContext.tsx`: Gerenciamento de estado global para configurações do site.
- `migrations/`: Arquivos modulares contendo todo o esquema de banco de dados e políticas de segurança.
- `database-migration-full.sql`: Arquivo consolidado para futuras migrações.

## Dados rastreados e enviados ao BD

- `nome`, `email`, `whatsapp`, `solucao_interesse`, `descricao_necessidade`
- Parâmetros UTM: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`

## Desenvolvimento

1. **Configurar variáveis:** Preencha o `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. **Banco de Dados:** Rode os arquivos da pasta `migrations/` no SQL Editor do seu Supabase em ordem numérica.
3. **Rodar o projeto:** `npm install` e `npm run dev`.

⚠️ **IMPORTANTE**: Nunca commite o `.env.local`.
