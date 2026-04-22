# 📦 Setup: Supabase Storage para Upload de Arquivos

## 🎯 Objetivo
Configurar o bucket `site-assets` no Supabase Storage para permitir upload de imagens (logo e favicon) com acesso público para leitura e restrito para escrita (apenas admin).

---

## 📋 Pré-requisitos
- Acesso ao projeto Supabase (console.supabase.com)
- Autenticação admin funcional
- Supabase JavaScript cliente já configurado (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)

---

## ⚡ Quick Setup (Recomendado)

### Opção 1: Usar SQL Script (Mais Rápido)

1. Abra [console.supabase.com](https://console.supabase.com) → Seu Projeto
2. Vá em **SQL Editor** → **New Query**
3. Abra o arquivo `setup-storage.sql` deste projeto
4. Copie TODO o conteúdo do arquivo
5. Cole no editor SQL do Supabase
6. Clique em **Run** (ou Ctrl + Enter)
7. Pronto! ✅

---

## 🚀 Passo 1: Criar o Bucket (Manual)

### Se preferir fazer manualmente:

1. Acesse **Storage** na sidebar esquerda
2. Clique em **Create a new bucket**
3. Preencha:
   - **Bucket name**: `site-assets`
   - **Public bucket**: ✅ **Marque como PÚBLICO**
   - **File size limit**: 5 MB (opcional, nosso código já valida 5MB)
4. Clique em **Create bucket**

---

## 🔐 Passo 2: Configurar Políticas de Segurança (RLS)

### Via SQL Script (Recomendado):

Copie e execute o conteúdo de `setup-storage.sql` no SQL Editor do Supabase.

### Manual via UI (Alternativo):

Na aba **Policies** do bucket `site-assets`:

#### ✅ Política 1: Permitir LEITURA (SELECT) - Pública

```sql
CREATE POLICY "Allow public read access to site-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');
```

#### ✅ Política 2: Permitir UPLOAD (INSERT) - Apenas Autenticado

```sql
CREATE POLICY "Allow authenticated users to upload to site-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-assets');
```

#### ✅ Política 3: Permitir UPDATE - Apenas Autenticado

```sql
CREATE POLICY "Allow authenticated users to update site-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-assets')
WITH CHECK (bucket_id = 'site-assets');
```

#### ✅ Política 4: Permitir DELETE - Apenas Autenticado

```sql
CREATE POLICY "Allow authenticated users to delete from site-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-assets');
```

---

## ✅ Verificação de Configuração

Após executar o SQL, você deve ver:

```
Bucket: site-assets
├── Status: Public ✅
├── Policies:
│   ├── Allow public read access
│   ├── Allow authenticated users to upload
│   ├── Allow authenticated users to update
│   └── Allow authenticated users to delete
└── Storage Status: Ready ✅
```

Para verificar, rode esta query SQL:

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'site-assets';
```

Esperado:
| id | name | public |
|----|------|--------|
| site-assets | site-assets | true |

---

## 🎨 Como Usar no Admin

### Na aba "Personalização":

1. **Upload Logo**:
   - Clique no área de upload ou arraste uma imagem
   - Formatos: PNG, JPG, WEBP, SVG (máx. 5MB)
   - Preview aparece em tempo real
   - URL é gerada automaticamente

2. **Upload Favicon**:
   - Mesmo processo que a logo
   - Recomendado: 32×32px ou 64×64px
   - Favicon é atualizado dinamicamente no `<head>` da página

3. **Salvar**:
   - Botão "Salvar Alterações" permanece desabilitado até fazer upload
   - Ao clicar, as URLs são salvas na tabela `site_settings` do Supabase
   - Toast de sucesso confirma

---

## 🔗 Fluxo Técnico Completo

```
Usuário Admin clica em Upload
    ↓
[FileUpload Component]
    ├─ Validação: tipo, tamanho (cliente)
    ├─ Drag & Drop suportado
    └─ Preview em tempo real
    ↓
uploadToStorage() → Supabase Storage
    ├─ checkBucketExists() valida bucket
    ├─ Gera nome único (timestamp + random)
    ├─ Upload para site-assets/logos/ ou /favicons/
    ├─ Obtém URL pública
    └─ Error Handling aprimorado:
       ├─ "Bucket not found" → Mensagem clara
       ├─ "Unauthorized" → Erro de permissão
       └─ Outros → Erro genérico
    ↓
[FileUpload mostra preview da URL]
    ↓
Admin clica "Salvar Alterações"
    ↓
useSiteSettings.saveSettings()
    ├─ Atualiza site_settings.logo_url ou favicon_url
    └─ Triggers reload automático
    ↓
[AdminSidebar e Index.tsx consumem URL dinâmica]
    ├─ AdminSidebar mostra logo dinâmica no header
    ├─ Index mostra logo dinâmica na landing page
    └─ Favicon é atualizado no <link rel="icon">
```

---

## 📝 Estrutura de Pastas no Storage

Após uso, o bucket `site-assets` terá:

```
site-assets/
├── logos/
│   ├── 1713799234123-abc12def.png
│   ├── 1713799456789-xyz98wvs.jpg
│   └── ...
└── favicons/
    ├── 1713799234567-def34ghi.webp
    └── ...
```

Cada arquivo tem nome único (timestamp + string aleatória) para evitar conflitos.

---

## 🛡️ Segurança

### ✅ Garantido:
- Apenas usuários autenticados (admin) podem fazer upload
- Qualquer pessoa pode ler as imagens públicas (necessário para site funcionar)
- Validação no cliente: tipo de arquivo, tamanho máximo
- Validação no servidor: bucket existe, permissões RLS
- Nomes únicos impedem sobrescrita intencional

### ⚠️ Considerações:
- Usuários admin podem deletar via DELETE policy
- Se precisar remover essa permissão, comente a política DELETE no `setup-storage.sql`
- Para ambiente produção, considere adicionar rate limiting

---

## 🐛 Troubleshooting

### Erro: "Bucket 'site-assets' not found"

**Solução:**
1. ✅ Execute o `setup-storage.sql` no Supabase SQL Editor
2. ✅ Verifique se o bucket foi criado em **Storage** → **Buckets**
3. ✅ Verifique se o nome é exatamente `site-assets` (case-sensitive)

### Erro: "Unauthorized" ou "Forbidden"

**Solução:**
1. ✅ Verifique se o usuário está autenticado (admin logado)
2. ✅ Execute todas as 4 políticas de RLS do `setup-storage.sql`
3. ✅ Confirme que a política INSERT está criada para `authenticated`

### Erro: "Access denied" ao fazer upload

**Solução:**
1. ✅ Verifique `VITE_SUPABASE_ANON_KEY` nos .env.local (deve estar correto)
2. ✅ Verifique se o usuário está no grupo `authenticated` (deve ter JWT)
3. ✅ Rode novamente: `SELECT * FROM auth.users WHERE id = 'seu-user-id'`

### Imagem não aparece após upload

**Solução:**
1. ✅ Verifique se a URL foi copiada corretamente
2. ✅ Teste a URL diretamente no navegador (deve carregar a imagem)
3. ✅ Verifique a política SELECT (deve permitir public read)

### "File too large" ou "Invalid file type"

**Solução:**
- ✅ Máximo: 5MB
- ✅ Formatos: PNG, JPG, WEBP, SVG
- ✅ Validação acontece no cliente e no servidor

---

## 📂 Arquivos Relacionados

- `src/lib/storageService.ts` - Utilitários de upload com error handling
- `src/components/ui/file-upload.tsx` - Componente de upload (UI)
- `src/pages/admin/Personalization.tsx` - Página de settings
- `src/hooks/useSiteSettings.ts` - Hook para persistência de URLs
- `setup-storage.sql` - SQL script para setup completo

---

## 🚀 Próximas Etapas

1. ✅ Execute `setup-storage.sql` no Supabase Console
2. ✅ Verifique bucket em **Storage** → **site-assets**
3. ✅ Teste upload na aba Admin → Personalização
4. ✅ Verifique se logo/favicon aparecem dinamicamente
5. ✅ Deploy para Vercel (`npm run deploy`)

---

## 📚 Documentação

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript/storage-createbucket)

---

**Data**: 22 de Abril de 2026  
**Projeto**: Glauber Ads - Site + Admin Dashboard  
**Status**: ✅ Pronto para Setup no Supabase  
**Última Atualização**: Adicionado SQL script e error handling aprimorado

