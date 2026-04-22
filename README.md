# Glauber Ads

Landing page premium da Glauber Ads com foco em conversão, captura estruturada de leads e redirecionamento inteligente para WhatsApp.

## Visão geral

O projeto foi construído como um ativo comercial real para apresentar os serviços da Glauber Ads e transformar interesse em leads qualificados.

### Objetivos principais

- apresentar posicionamento e autoridade da marca
- conduzir o usuário por uma narrativa de conversão
- capturar leads por modal reutilizável em todos os CTAs
- salvar os dados da captura na tabela `leads`
- redirecionar o lead para o WhatsApp após envio bem-sucedido

## Stack atual

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- integração com Supabase no frontend

## Funcionalidades implementadas

- página inicial com visual premium dark
- identidade da Glauber Ads aplicada com logo oficial
- seções de autoridade, dores, soluções e proposta comercial
- modal inteligente reutilizável para captura de leads
- validação básica de formulário
- envio de lead para a tabela `leads`
- captura de parâmetros UTM da URL
- redirecionamento para WhatsApp após salvar o lead

## Estrutura principal

- `src/pages/Index.tsx`: página principal, CTAs, modal e lógica de captura
- `src/App.tsx`: configuração de rotas
- `src/index.css`: tokens visuais e tema dark
- `src/integrations/supabase/client.ts`: cliente da integração com banco

## Dados esperados na tabela `leads`

O fluxo atual envia os seguintes campos:

- `nome`
- `whatsapp`
- `solucao_interesse`
- `descricao_necessidade`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`

## Observações importantes

- o salvamento do lead acontece antes da abertura do WhatsApp
- se a tabela `leads` não permitir inserção, o formulário exibirá erro
- este projeto está usando Lovable Cloud como backend do ambiente atual

## Desenvolvimento

### Configuração inicial

1. **Configurar variáveis de ambiente:**
   - Copie `.env.example` para `.env.local`
   - Preencha as variáveis com suas credenciais do Supabase
   ```bash
   cp .env.example .env.local
   ```

2. **Instalar dependências e rodar:**
   ```bash
   npm install
   npm run dev
   ```

### Build para produção

```bash
npm run build
```

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env.local` - ele está no `.gitignore` e contém credenciais sensíveis.
