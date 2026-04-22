# 📦 Setup: Supabase Storage para Upload de Arquivos

## 🎯 Objetivo
Configurar o bucket `site-assets` no Supabase Storage para permitir upload de imagens (logo e favicon) com acesso público para leitura e restrito para escrita (apenas admin).

---

## 📋 Pré-requisitos
- Acesso ao projeto Supabase (console.supabase.com)
- Autenticação admin funcional
- Supabase JavaScript cliente já configurado (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)

---

## 🚀 Passo 1: Criar o Bucket

### No Supabase Console:
1. Acesse **Storage** na sidebar esquerda
2. Clique em **Create a new bucket**
3. Preencha:
   - **Bucket name**: `site-assets`
   - **Public bucket**: ❌ **Deixe DESMARCADO** (configuraremos manualmente as políticas)
   - **File size limit**: 5 MB (opcional, nosso código já valida 5MB)
4. Clique em **Create bucket**

---

## 🔐 Passo 2: Configurar Políticas de Segurança (RLS)

O bucket foi criado, mas agora precisamos configurar as políticas para:
- ✅ Usuários autenticados (admin) podem fazer **upload** (INSERT)
- ✅ Qualquer pessoa pode **ler** as imagens (SELECT) - para exibir no site
- ❌ Usuários não podem **deletar** (para evitar danos)

### Na aba "Policies" do bucket `site-assets`:

#### Política 1: Permitir UPLOAD (INSERT) para admin autenticado

1. Clique em **New Policy** → **Create a policy from a template**
2. Selecione: **Enable insert access based on user ID**
3. Configure:
   ```
   - Policy Name: "Allow authenticated users to upload"
   - Allowed operation: INSERT
   - Target roles: authenticated
   - Using expression: (auth.role() = 'authenticated'::text)
   - With check: (auth.role() = 'authenticated'::text)
   ```
4. Clique em **Review** → **Save policy**

**Ou via SQL (alternativo):**
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-assets');
```

#### Política 2: Permitir LEITURA (SELECT) para público

1. Clique em **New Policy** → **Create a policy from a template**
2. Selecione: **Enable read access to everyone**
3. Configure:
   ```
   - Policy Name: "Allow public read access"
   - Allowed operation: SELECT
   - Target roles: public (ou deixar em branco para todos)
   - Using expression: (bucket_id = 'site-assets')
   ```
4. Clique em **Review** → **Save policy**

**Ou via SQL (alternativo):**
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');
```

---

## 📝 Passo 3: Verificar Configuração

Após criar as políticas, você deve ver no Supabase:

```
Bucket: site-assets
├── Policies:
│   ├── Allow authenticated users to upload (INSERT)
│   └── Allow public read access (SELECT)
└── Public: No (apenas via políticas)
```

---

## ✅ Passo 4: Testar Upload Manual (Opcional)

1. Vá até o bucket `site-assets` no console Supabase
2. Clique em **Upload file**
3. Selecione uma imagem (PNG, JPG, etc.)
4. Confirme upload
5. Clique no arquivo e copie a **Public URL**
6. Cole em um navegador - a imagem deve carregar normalmente

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
Usuário Admin
    ↓
[Upload via FileUpload Component]
    ↓
uploadToStorage() → Supabase Storage
    ├─ Validação (tipo, tamanho)
    ├─ Gera nome único (timestamp + random)
    ├─ Upload para site-assets/logos/ ou /favicons/
    ├─ Obtém URL pública via getPublicUrl()
    └─ Retorna URL
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
- Nomes únicos impedem sobrescrita intencional

### ⚠️ Considerações:
- Usuários admin não podem deletar via UI (política não permite DELETE)
- Se precisar deletar, faça manualmente no Supabase console
- Para ambiente produção, considere adicionar rate limiting no backend

---

## 🐛 Troubleshooting

### Erro: "Access denied" ao fazer upload
- ✅ Verifique se a política de INSERT está criada
- ✅ Verifique se o usuário está autenticado
- ✅ Verifique `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente

### Erro: "Bucket not found"
- ✅ Verifique se o bucket foi criado com nome `site-assets` (case-sensitive)
- ✅ Verifique se o projeto Supabase está correto

### Imagem não aparece após upload
- ✅ Verifique se a política de SELECT está criada
- ✅ Verifique se a URL pública foi gerada corretamente
- ✅ Teste a URL diretamente no navegador

### "File too large" ou "Invalid file type"
- ✅ Confirmado: máximo 5MB e formatos: PNG, JPG, WEBP, SVG
- ✅ Código valida no cliente (veja `validateFile()` em `src/lib/storageService.ts`)

---

## 🚀 Próximas Etapas

1. Criar bucket e políticas (este documento)
2. ✅ Código já implementado:
   - `uploadToStorage()` em `src/lib/storageService.ts`
   - `FileUpload` component em `src/components/ui/file-upload.tsx`
   - `Personalization.tsx` com novo UI
3. Deploy para Vercel (seu `npm run deploy`)
4. Testar upload na aba Admin → Personalização
5. Verificar se logo/favicon aparecem dinamicamente

---

## 📚 Documentação

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript/storage-createbucket)

---

**Data**: 22 de Abril de 2026  
**Projeto**: Glauber Ads - Site + Admin Dashboard  
**Status**: ✅ Pronto para Setup no Supabase
