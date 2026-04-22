# 🔧 Guia de Setup Completo - Corrigindo Erros de Banco de Dados e Storage

## 📊 Problemas que este guia resolve

✅ Erro: "Bucket 'site-assets' not found"  
✅ Erro: "user_roles table not found"  
✅ Erro: "site_settings table not found"  
✅ Logo/Favicon não aparecem dinamicamente  
✅ Uploader de arquivo não funciona  

---

## 🚀 Solução Rápida (5 minutos)

### Passo 1: Abra o arquivo SQL

Localize o arquivo **`setup-database-complete.sql`** no seu projeto

### Passo 2: Copie TODO o conteúdo

Selecione tudo (Ctrl+A) e copie (Ctrl+C)

### Passo 3: Execute no Supabase

1. Vá em [console.supabase.com](https://console.supabase.com)
2. Seu Projeto → **SQL Editor** → **New Query**
3. Cole (Ctrl+V)
4. Clique em **Run** (ou Ctrl + Enter)

### Passo 4: Aguarde a conclusão

Você deve ver uma mensagem de sucesso:

```
user_roles | 0
site_settings | 1
storage.buckets | 1
```

### Passo 5: Teste

Volte à aba **Admin → Personalização** e tente fazer upload

---

## 📋 O que o SQL faz

### 1. **Cria/Verifica Tabela `user_roles`**
```sql
-- Gerencia papéis de usuários (admin, moderator, user)
-- Permite que o sistema identifique quem é admin
-- Usa RLS (Row Level Security) para proteção
```

### 2. **Cria/Verifica Tabela `site_settings`**
```sql
-- Armazena configurações dinâmicas
-- Colunas: logo_url, favicon_url
-- Públicamente legível (para carregar imagens no site)
-- Editável apenas por admins
```

### 3. **Cria/Verifica Bucket `site-assets`**
```sql
-- Local de armazenamento de imagens no Supabase Storage
-- Público (qualquer pessoa pode ler imagens)
-- Escritável apenas por usuários autenticados
```

### 4. **Configura Políticas de Segurança (RLS)**
```sql
-- Controla quem pode fazer o quê em cada tabela
-- SELECT (leitura): público para site_settings, admins para user_roles
-- INSERT (criar): apenas admins
-- UPDATE (editar): apenas admins
-- DELETE (apagar): apenas admins (storage)
```

---

## 🔍 Estrutura do Banco de Dados

```
public schema:
├── user_roles (gerenciamento de permissões)
│   ├── id (UUID, PK)
│   ├── user_id (UUID, FK → auth.users)
│   ├── role (ENUM: admin, moderator, user)
│   └── created_at (TIMESTAMP)
│
├── site_settings (configurações dinâmicas)
│   ├── id (UUID, PK)
│   ├── logo_url (TEXT, nullable)
│   ├── favicon_url (TEXT, nullable)
│   ├── created_at (TIMESTAMP)
│   └── updated_at (TIMESTAMP)
│
└── Índices para Performance:
    ├── idx_user_roles_user_id
    └── idx_user_roles_role

storage:
└── buckets
    └── site-assets (public bucket)
        ├── logos/ (uploads de logo)
        └── favicons/ (uploads de favicon)
```

---

## 🛡️ Segurança Configurada

### `user_roles` RLS:
| Operação | Público | Autenticado | Admin |
|----------|---------|-------------|-------|
| SELECT | ❌ | Próprio | ✅ Todos |
| INSERT | ❌ | ❌ | ✅ |
| UPDATE | ❌ | ❌ | ✅ |
| DELETE | ❌ | ❌ | ✅ |

### `site_settings` RLS:
| Operação | Público | Autenticado | Admin |
|----------|---------|-------------|-------|
| SELECT | ✅ | ✅ | ✅ |
| INSERT | ❌ | ❌ | ✅ |
| UPDATE | ❌ | ❌ | ✅ |
| DELETE | ❌ | ❌ | ❌ |

### `site-assets` Storage:
| Operação | Público | Autenticado |
|----------|---------|-------------|
| SELECT (ler) | ✅ | ✅ |
| INSERT (upload) | ❌ | ✅ |
| UPDATE | ❌ | ✅ |
| DELETE | ❌ | ✅ |

---

## 💻 Código com Error Handling Aprimorado

### `src/hooks/useAuth.tsx`
- ✅ Detecta se `user_roles` não existe
- ✅ Fallback: Assume primeiro usuário como admin
- ✅ Log de erros para debugging

### `src/hooks/useSiteSettings.ts`
- ✅ Detecta se `site_settings` não existe
- ✅ Retorna valores padrão (null)
- ✅ Não quebra se tabela estiver faltando

### `src/lib/storageService.ts`
- ✅ Valida bucket antes de upload
- ✅ Mensagens de erro claras com instruções
- ✅ Diferencia erros de config vs outros

---

## 🐛 Troubleshooting

### Erro: "Execute SQL error"

**Causa**: Sintaxe SQL ou permissões insuficientes

**Solução**:
1. Verifique se copiou TODO o arquivo `setup-database-complete.sql`
2. Verifique se você é o owner do projeto Supabase
3. Tente copiar em partes (até a linha 100, depois 100-200, etc)

### Erro: "still not working after SQL"

**Causa**: Cache ou conexão antigas

**Solução**:
1. Recarregue a página (F5 ou Ctrl+Shift+R)
2. Abra devtools (F12) → Console
3. Procure por erros específicos
4. Tente novamente após 30 segundos

### Upload ainda retorna "Bucket not found"

**Causa**: Políticas não foram aplicadas

**Solução**:
1. Vá em [console.supabase.com](https://console.supabase.com)
2. **Storage** → **site-assets** → **Policies**
3. Verifique se há 4 políticas criadas (Public, Authenticated INSERT, UPDATE, DELETE)
4. Se não, clique em **New Policy** e repita manualmente

### Logo não aparece após upload

**Causa**: URL está salva mas não está sendo carregada

**Solução**:
1. Verifique se a URL começa com `https://`
2. Teste a URL em um novo aba (deve carregar a imagem)
3. Verifique se a política SELECT está criada para `site-assets`

---

## ✅ Verificação de Setup

Após executar o SQL, abra **SQL Editor** e rode:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve incluir: user_roles, site_settings

-- Verificar bucket criado
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'site-assets';

-- Deve retornar: site-assets, TRUE
```

---

## 📚 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `setup-database-complete.sql` | ⭐ SQL principal - execute este |
| `src/hooks/useAuth.tsx` | ✅ Melhorado com error handling |
| `src/hooks/useSiteSettings.ts` | ✅ Melhorado com fallbacks |
| `src/lib/storageService.ts` | ✅ Melhorado com validação |
| `src/pages/admin/Personalization.tsx` | Upload UI com feedback |
| `src/components/ui/file-upload.tsx` | Componente de upload |

---

## 🎯 Fluxo Completo Corrigido

```
Admin acessa "Personalização"
    ↓
Tenta fazer upload de logo
    ↓
[Valida arquivo: tipo, tamanho]
    ↓
[Verifica se bucket existe] ← IMPORTANTE
    ├─ ✅ Existe → Continua
    └─ ❌ Não → Mensagem clara com instruções
    ↓
[Upload para site-assets/logos/]
    ├─ ✅ Sucesso → Preview aparece
    └─ ❌ Erro → Toast com detalhes
    ↓
Admin clica "Salvar Alterações"
    ↓
[Salva em site_settings]
    ├─ ✅ Sucesso → Recarrega dados
    └─ ❌ Erro → Toast com feedback
    ↓
[AdminSidebar atualiza logo dinâmica]
[Index.tsx atualiza logo landing page]
[Favicon atualiza no <head>]
```

---

## 🚀 Próximos Passos

1. ✅ Execute `setup-database-complete.sql`
2. ✅ Recarregue a aplicação
3. ✅ Teste upload em Admin → Personalização
4. ✅ Verifique se logo/favicon aparecem dinamicamente
5. ✅ Rode `npm run deploy` para commit final

---

## 📞 Se ainda tiver problemas

1. Abra **devtools** (F12) → **Console**
2. Copie os erros que aparecem
3. Verifique em [console.supabase.com](https://console.supabase.com):
   - **Storage** → **site-assets** existe?
   - **SQL Editor** → Rode a query de verificação acima
   - **Policies** → Todas as 4 políticas estão lá?

---

**Data**: 22 de Abril de 2026  
**Projeto**: Glauber Ads - Site + Admin Dashboard  
**Status**: ✅ Pronto para Setup Completo
