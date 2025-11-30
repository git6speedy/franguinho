# Correção do Problema de Limite de Insights

## Problema Identificado

O limite diário de insights não estava sendo carregado corretamente na página Insights porque:

1. **Settings.tsx (admin)**: Conseguia ler `daily_limit_per_store: 8` ✅
2. **Insights.tsx (usuário normal)**: Retornava `{data: null, error: null}` ❌

**Causa:** As políticas RLS (Row Level Security) da tabela `ai_settings` só permitiam que admins lessem os dados, mas usuários normais também precisam ver o limite diário para saber quantos insights podem solicitar.

## Solução

Foi criada uma migration que corrige as políticas RLS:

### Arquivo: `supabase/migrations/20251201000000_fix_ai_settings_rls.sql`

**O que a migration faz:**
1. Remove as políticas antigas restritivas
2. Cria nova política que permite TODOS lerem (SELECT)
3. Mantém restrição de que apenas ADMINS podem modificar (INSERT/UPDATE/DELETE)

## Como Aplicar a Correção

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard do seu projeto
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `supabase/migrations/20251201000000_fix_ai_settings_rls.sql`
4. Execute o SQL
5. Verifique se não há erros
6. **IMPORTANTE:** A migration foi corrigida para usar `has_role()` em vez de `profiles.role`

### Opção 2: Via CLI do Supabase

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

### ⚠️ Nota Importante

A migration usa a função `has_role(auth.uid(), 'admin'::app_role)` que é a forma correta de verificar se um usuário é admin neste projeto. Se você receber erro sobre `profiles.role`, significa que está usando uma versão antiga da migration - use a versão corrigida.
=======

## Verificação

Após aplicar a migration:

1. **Faça logout e login novamente** (para limpar cache de permissões)
2. Acesse a página **Insights** como usuário normal (não-admin)
3. Abra o console do navegador (F12)
4. Você deve ver:
   ```
   ✅ Limite diário carregado: 8
   ```
   Em vez de:
   ```
   ⚠️ Nenhuma configuração encontrada na tabela ai_settings
   ```

5. A interface deve mostrar **"0/8"** (ou o valor configurado) em vez de **"0/10"**

## Resumo das Mudanças

### Antes:
- ❌ Apenas admins podiam ler `ai_settings`
- ❌ Usuários normais viam sempre o valor padrão (10)
- ❌ Limite configurado pelo admin não tinha efeito

### Depois:
- ✅ Todos podem ler `ai_settings` (apenas leitura)
- ✅ Apenas admins podem modificar
- ✅ Limite configurado funciona para todos os usuários
- ✅ Sistema de créditos funciona corretamente

## Outras Correções Implementadas

Além da correção de RLS, também foram implementadas:

1. **Contagem correta de créditos:**
   - Só conta insights com status 'completed'
   - Insights 'pending' ou 'failed' não consomem crédito

2. **Crédito não volta ao excluir:**
   - Excluir um insight não devolve o crédito
   - Mensagem clara informa o usuário

3. **Sincronização em tempo real:**
   - Quando admin altera o limite, todas as páginas atualizam automaticamente
   - Usa Supabase Realtime para sincronização

4. **Logs de debug:**
   - Console mostra informações detalhadas
   - Facilita identificar problemas futuros

## Suporte

Se após aplicar a migration o problema persistir:

1. Verifique se a migration foi executada com sucesso
2. Faça logout e login novamente
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Verifique os logs no console do navegador

Se ainda houver problemas, verifique:
- Se o usuário tem um `profile` válido no banco
- Se a tabela `ai_settings` tem pelo menos um registro
- Se o RLS está habilitado na tabela
