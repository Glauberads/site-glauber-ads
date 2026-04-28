## Contexto do projeto

Este projeto representa a plataforma comercial omni-channel da Glauber Ads (OmniVendas). Ele atua como um canal de aquisição de oportunidades na ponta pública e como um sistema de gestão tática na ponta administrativa.

## Arquitetura de Conversão (Landing Page)

O principal objetivo da face pública é transformar tráfego em conversas comerciais qualificadas:

1. **Narrativa e Persuasão:** O usuário entende o posicionamento, reconhece dores operacionais e visualiza soluções.
2. **Captura Inteligente:** CTAs abrem um modal que coleta Nome, Email, WhatsApp e Necessidade.
3. **Rastreamento Integrado:** 
   - A URL é varrida em busca de parâmetros UTM (`utm_source`, `utm_medium`, etc.) que são salvos no banco.
   - Ao enviar o formulário, o sistema dispara nativamente eventos para o DataLayer (Google) e Meta Pixel (Lead), enriquecidos com `% de scroll` e `segundos na página`.
4. **Acionamento:** O lead é encaminhado diretamente ao WhatsApp com uma mensagem pré-formatada.

## Arquitetura de Gestão (Painel Admin)

Acessível apenas por usuários autenticados com o cargo de `admin`, o painel (`/admin`) permite o controle total da operação sem necessidade de alterar o código-fonte:

### 1. Gestão de Leads
Acesso em tempo real aos leads capturados, visualizando informações de contato, necessidade descrita e, crucialmente, a origem do tráfego (UTMs). Inclui função de exportação em CSV para integrações externas.

### 2. Marketing & Tracking
Gestão visual de scripts de rastreamento. O administrador pode inserir o ID do Meta Pixel e do Google Tag Manager diretamente na interface. A plataforma injeta esses scripts dinamicamente no `<head>` da landing page pública de forma assíncrona.

### 3. Personalização da Marca
Permite o upload de logotipos e favicons. Os arquivos são enviados para o Supabase Storage (`site-assets`), e a URL pública é atualizada instantaneamente em toda a aplicação via um `SettingsContext` global.

## Segurança e Banco de Dados

O projeto utiliza **Supabase** como backend as a service, com uma arquitetura de segurança rigorosa:
- **Row Level Security (RLS):** Todas as tabelas (`leads`, `site_settings`, `settings`, `user_roles`) possuem políticas restritas. Apenas administradores podem modificar as configurações, e visitantes não autenticados só podem inserir leads ou ler as configurações públicas.
- **Migrações Organizadas:** Todo o esquema de banco de dados, enums e triggers (como a autocriação de perfil no login) estão documentados na pasta `migrations/`.

## Papel do projeto no negócio

Este ecossistema conecta marketing, aquisição e vendas. Ele garante que a Glauber Ads não apenas capte demanda com um visual premium, mas tenha controle absoluto sobre os dados gerados (UTMs e rastreamento de eventos) e flexibilidade operacional para trocar marcas ou pixels sob demanda.