## Contexto do projeto

Este projeto representa o site comercial da Glauber Ads, concebido para funcionar como um canal de aquisição de oportunidades e não apenas como uma vitrine institucional. A proposta é combinar posicionamento premium, linguagem estratégica e uma experiência orientada à conversão.

## Propósito

O principal objetivo do site é transformar tráfego em conversas comerciais qualificadas. Para isso, a interface foi pensada para conduzir o visitante por uma sequência clara:

1. entender rapidamente o posicionamento da Glauber Ads
2. reconhecer dores comuns de operação e aquisição
3. visualizar as soluções ofertadas
4. acionar um CTA
5. preencher um modal de captura
6. ter seus dados salvos no banco
7. ser encaminhado ao WhatsApp para continuidade da conversa

## Como o projeto funciona

### 1. Entrada do usuário

O usuário acessa a rota principal `/`, onde encontra a landing page com identidade visual dark e proposta de valor voltada a growth, performance, automação e inteligência comercial.

### 2. Navegação e persuasão

A página foi estruturada em blocos de convencimento, incluindo:

- hero principal com proposta de valor
- blocos de autoridade
- explicação dos gargalos de marketing e operação
- apresentação das soluções da Glauber Ads
- CTAs distribuídos em pontos estratégicos da página

Esses blocos têm a função de aquecer a intenção do visitante antes da captura.

### 3. Modal reutilizável de captura

Todos os CTAs relevantes abrem o mesmo modal inteligente. Esse modal centraliza o fluxo de conversão e evita duplicação de lógica.

O formulário coleta:

- nome
- WhatsApp
- solução de interesse
- descrição da necessidade

Também existe validação básica no frontend para impedir envio incompleto ou inválido.

### 4. Persistência do lead

Quando o formulário é enviado, o projeto tenta gravar os dados na tabela `leads` usando a integração configurada no cliente Supabase do frontend.

Além dos campos principais, o sistema também lê parâmetros UTM da URL atual para registrar origem da campanha, incluindo:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`

Isso permite conectar marketing, atribuição e operação comercial.

### 5. Redirecionamento para WhatsApp

Depois que o lead é salvo com sucesso, o sistema monta uma mensagem com base na solução escolhida e na necessidade descrita, e então abre uma nova janela para o WhatsApp. Assim, a jornada combina captura estruturada com contato comercial imediato.

### 6. Tratamento de erro

Se houver falha no envio ao banco, o redirecionamento não deve prosseguir como fluxo ideal. Em vez disso, o usuário recebe uma mensagem de erro orientando sobre falha no envio. Na prática, esse ponto depende de a tabela `leads` estar corretamente acessível e com permissões adequadas para inserção.

## Estrutura técnica resumida

### Frontend

- React com TypeScript
- Vite como ambiente de desenvolvimento e build
- Tailwind CSS com tokens semânticos definidos em `src/index.css`
- componentes UI baseados em shadcn/ui

### Arquivos centrais

- `src/pages/Index.tsx`: concentra a landing page e a lógica do modal
- `src/App.tsx`: define o roteamento principal
- `src/index.css`: define o sistema de cores e o tema
- `src/integrations/supabase/client.ts`: inicializa o cliente de banco usado na captura

## Papel do projeto no negócio

Este site atua como ponte entre marketing e vendas. Ele não serve apenas para apresentar a Glauber Ads, mas para captar demanda com contexto, registrar essa demanda com dados de campanha e acelerar o primeiro contato comercial por WhatsApp.

Em resumo, o projeto foi desenhado para:

- fortalecer percepção de valor
- aumentar a taxa de captura
- organizar os dados iniciais do lead
- encurtar o caminho até a conversa comercial