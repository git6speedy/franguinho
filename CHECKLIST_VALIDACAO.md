Update 24.11 0.01
Adição de Aba Whatsapp e Atualização do monitor
Update 24.11 0.02
Correção de detecção de conversas whatsapp
Update 24.11 0.03
Adição de funções pdv no whatsapp
Update 24.11 0.04
Conectando whatsapp com crm
Update 24.11 0.05
mudar conexão whatsapp de saida para webhook
Update 25.11 0.06
correção no recebimento e envio de mensagens (whatsapp)
Update 26.11 0.07
adição de função upsell (Pagina Marketing).
Update 27.11 0.08
Atualizações do sistema de upsell, alteração em algumas paginas.
Update 28.11 0.09
Adição de sistema de 2 formas de pagamento e correção da impressão do caixa analitico
Update 28.11 0.10
Criação de pagina de caixas e correção da impressão de caixa analitico
Update 28.11 0.11
Reativação da pagina Order Panel
Update 28.11 0.12
Correção do chat whatsapp (Correr pagina automaticamente para baixo ao chegar novas mensagens).
Update 28.11 0.13
Correção e estilização da pagina "Minhas Loja" e "Marketing" e adição de sistema de importação de cadastro de clientes
Update 28.11 0.14
Correção de nome e numero na pagina whatsapp, adicionado a função nova conversa direto do painel
Update 28.11 0.15
conexão dos cupom de descontos com pdv
Update 29.11 0.16
Criação do sistema de "Controle de pereciveis"
Update 29.11 0.17
Criação de sistema de insight
Update 29.11 0.18
Correção de bugs no sistema de insight
Update 29.11 0.19
adição de função "Rapido" no PDV.
adição de função insight aberto, insight fechado.
função de editar numero do cliente
adição de campo de busca na pagina whatsapp nova conversa
Update 29.11 0.19
correção de contador insight

# Checklist de Validação - Novas Funcionalidadess

## ✅ 1. Gestão de Formas de Pagamento e Máquinas

### Formas de Pagamento
- [ ] **Implementado**: Componente `PaymentMethodsManager` criado
- [ ] **Localização**: Página Minha Loja
- [ ] **Funcionalidades**:
  - [ ] Listar formas de pagamento com toggle (ativar/desativar)
  - [ ] Criar novas formas de pagamento
  - [ ] Adicionar formas padrão: 'Ticket Refeição' e 'Ifood'
  - [ ] Vincular forma de pagamento a máquina de cartão
  - [ ] Editar formas de pagamento existentes
  - [ ] Excluir formas de pagamento (exceto padrão)
- [ ] **Lógica Especial**:
  - [ ] 'Ifood' só habilitado quando canal de venda for 'Ifood' no PDV
- [ ] **Teste Manual**:
  1. Acessar Minha Loja
  2. Criar nova forma de pagamento
  3. Testar toggle ativar/desativar
  4. Adicionar formas padrão
  5. Vincular a uma máquina
- [ ] **Console**: Sem erros JavaScript

### Máquinas de Cartão
- [ ] **Implementado**: Componente `CardMachinesManager` criado
- [ ] **Localização**: Página Minha Loja (abaixo de Formas de Pagamento)
- [ ] **Funcionalidades**:
  - [ ] Cadastrar novas máquinas
  - [ ] Configurar taxas de débito e crédito
  - [ ] Configurar taxas de parcelamento (1x até 12x)
  - [ ] Editar máquinas existentes
  - [ ] Ativar/desativar máquinas
  - [ ] Excluir máquinas
- [ ] **UI/UX**:
  - [ ] Interface com tabs (Geral, Taxas Básicas, Parcelamento)
  - [ ] Campos numéricos para taxas
- [ ] **Teste Manual**:
  1. Criar nova máquina de cartão
  2. Configurar taxas de débito e crédito
  3. Configurar taxas de parcelamento
  4. Verificar salvamento correto
- [ ] **Console**: Sem erros JavaScript

### Integração PDV/Totem/OrderPanel
- [ ] **Pendente**: Exibir dropdown de máquinas ao selecionar Crédito/Débito
- [ ] **Pendente**: Filtrar máquinas ativas apenas
- [ ] **Pendente**: Aplicar taxa correta conforme máquina selecionada

---

## ✅ 2. Precificação Diferenciada Ifood

- [ ] **Implementado**: Campo `ifood_price` adicionado à tabela products
- [ ] **Localização**: Página de Cadastro de Produtos
- [ ] **Funcionalidades**:
  - [ ] Campo "Valor Ifood" no formulário de produtos
  - [ ] Salvar preço diferenciado no banco
- [ ] **Lógica PDV**:
  - [ ] Quando canal = 'Ifood', buscar preço do campo ifood_price
  - [ ] Se ifood_price for null, usar preço normal
- [ ] **Teste Manual**:
  1. Cadastrar produto com preço Ifood diferente
  2. No PDV, selecionar canal Ifood
  3. Verificar se preço correto é aplicado
- [ ] **Console**: Sem erros JavaScript

---

## ✅ 3. Módulo de RH (Recursos Humanos)

### Funções/Cargos
- [ ] **Implementado**: Componente `JobRolesTab` criado
- [ ] **Localização**: Página RH > Aba Funções
- [ ] **Funcionalidades**:
  - [ ] Cadastrar novas funções (Caixa, Gerente, Vendedor, etc.)
  - [ ] Editar funções existentes
  - [ ] Excluir funções (exceto sistema)
  - [ ] Função "Administrador" criada automaticamente (is_system_role=true)
- [ ] **Teste Manual**:
  1. Acessar RH > Funções
  2. Criar novas funções
  3. Tentar editar função de sistema (não deve permitir)
  4. Excluir função personalizada
- [ ] **Console**: Sem erros JavaScript

### Funcionários
- [ ] **Implementado**: Componente `EmployeesTab` criado
- [ ] **Localização**: Página RH > Aba Funcionários
- [ ] **Funcionalidades**:
  - [ ] Cadastrar funcionários com dados completos
  - [ ] Campos: Nome, CPF, RG, Telefone, Email, Endereço
  - [ ] Campos: Salário, Data Contratação, Data Demissão
  - [ ] Vincular função ao funcionário
  - [ ] Badge Ativo/Inativo automático
  - [ ] Editar funcionários
  - [ ] Excluir funcionários
- [ ] **UI/UX**:
  - [ ] Exibição clara de informações
  - [ ] Badges de status (Ativo/Inativo)
- [ ] **Teste Manual**:
  1. Cadastrar novo funcionário
  2. Vincular a uma função
  3. Adicionar data de demissão (status deve mudar para Inativo)
  4. Editar funcionário
- [ ] **Console**: Sem erros JavaScript

### Escalas de Trabalho
- [ ] **Implementado**: Componente `WorkSchedulesTab` criado
- [ ] **Localização**: Página RH > Aba Escalas
- [ ] **Funcionalidades**:
  - [ ] Criar escalas por dia da semana
  - [ ] Definir horário de entrada e saída
  - [ ] Agrupar escalas por funcionário
  - [ ] Editar escalas
  - [ ] Excluir escalas
- [ ] **UI/UX**:
  - [ ] Escalas agrupadas por funcionário
  - [ ] Badges para dias da semana
- [ ] **Teste Manual**:
  1. Criar escala para funcionário
  2. Definir horários de trabalho
  3. Verificar agrupamento por funcionário
- [ ] **Console**: Sem erros JavaScript

### Sistema de Ponto
- [ ] **Implementado**: Componente `TimeClockTab` criado
- [ ] **Localização**: Página RH > Aba Ponto
- [ ] **Funcionalidades**:
  - [ ] Registrar entrada e saída
  - [ ] Calcular horas trabalhadas
  - [ ] Campo de intervalo (minutos)
  - [ ] Filtros: funcionário, data inicial, data final
  - [ ] Exportar relatório CSV
  - [ ] Badge "Em andamento" para pontos não finalizados
- [ ] **Cálculos**:
  - [ ] Horas trabalhadas = (Saída - Entrada) - Intervalo
- [ ] **Teste Manual**:
  1. Registrar entrada de funcionário
  2. Registrar saída
  3. Verificar cálculo de horas
  4. Filtrar por funcionário/data
  5. Exportar relatório CSV
- [ ] **Console**: Sem erros JavaScript

---

## ✅ 4. Sistema de Usuários e Permissões

### Cadastro de Usuários
- [ ] **Pendente**: Nova aba "Usuários" dentro de Cadastros
- [ ] **Funcionalidades**:
  - [ ] Cadastrar usuários (nome, email, senha, função)
  - [ ] Vínculo automático à loja do criador
  - [ ] Sistema de checklist de permissões por aba
  - [ ] Editar usuários
  - [ ] Excluir usuários
- [ ] **Permissões Disponíveis**:
  - [ ] Dashboard
  - [ ] PDV
  - [ ] Painel de Pedidos
  - [ ] Fidelidade
  - [ ] Produtos
  - [ ] Estoque
  - [ ] Marketing
  - [ ] Tarefas
  - [ ] Cadastros
  - [ ] Minhas Finanças
  - [ ] Relatórios
  - [ ] Minha Loja
  - [ ] Configurações
  - [ ] RH
- [ ] **Teste Manual**:
  1. Criar novo usuário
  2. Definir permissões específicas
  3. Login com usuário criado
  4. Verificar que só vê abas permitidas
- [ ] **Console**: Sem erros JavaScript

---

## ⚠️ 5. Relatórios de Fechamento de Caixa

- [ ] **Pendente**: Remover botão "Exportar CSV"
- [ ] **Pendente**: Adicionar botão "Imprimir Relatório"
- [ ] **Funcionalidades**:
  - [ ] Modal de seleção: Sintético ou Analítico
  - [ ] Relatório Sintético: Resumo geral do caixa
  - [ ] Relatório Analítico: 
    - Número do pedido
    - Nome do cliente
    - Itens comprados
    - Forma de pagamento
    - Venda a venda detalhada
- [ ] **Teste Manual**:
  1. Acessar Dashboard > Caixas Fechados
  2. Clicar em "Imprimir Relatório"
  3. Selecionar tipo (Sintético/Analítico)
  4. Verificar conteúdo do relatório
- [ ] **Console**: Sem erros JavaScript

---

## ⚠️ 6. Melhoria Visual dos Pedidos

- [ ] **Pendente**: Dashboard > Todos os Pedidos
- [ ] **UI Changes**:
  - [ ] Inverter ordem: Nome do Cliente (topo) / ID do Pedido (baixo)
  - [ ] Adicionar botão (I) em cada pedido
- [ ] **Modal de Detalhes**:
  - [ ] Hora da compra
  - [ ] Responsável pela venda (quem)
  - [ ] Canal (PDV, Totem, Loja)
  - [ ] ID do Caixa utilizado
  - [ ] Forma de Pagamento detalhada
  - [ ] Timestamps (Hora do pedido vs Hora da confirmação)
- [ ] **Teste Manual**:
  1. Acessar Dashboard > Todos os Pedidos
  2. Verificar nova ordem de exibição
  3. Clicar no botão (I)
  4. Verificar todas as informações no modal
- [ ] **Console**: Sem erros JavaScript

---

## ⚠️ 7. Configurações do Monitor (Slides)

- [ ] **Pendente**: Marketing > Configurações do Monitor
- [ ] **Funcionalidades**:
  - [ ] Botão de seleção de modo:
    1. Slide Full Screen
    2. Slide Banner
    3. Full Screen+Banner
    4. Desligado
  - [ ] Campo "Desaparecer" (minutos)
  - [ ] Gerenciamento separado de banners:
    - Card para Full Screen
    - Card para Slide Banner
    - Listas independentes de imagens
- [ ] **Lógica de Slides**:
  - [ ] Full Screen: overlay display:none por padrão
  - [ ] Aparecer a cada "Tempo de Inatividade"
  - [ ] Desaparecer a cada "X minutos"
  - [ ] Ocultar ao atualizar pedidos
- [ ] **Slide Banner**:
  - [ ] Formato 1920x1080px vertical
  - [ ] Fixo à direita
  - [ ] Exibe "Em Preparo" e "Pronto"
  - [ ] Ignora "Aguardando"
  - [ ] Respeita configurações de status
- [ ] **Teste Manual**:
  1. Configurar modo de slide
  2. Adicionar banners separadamente
  3. Testar cada modo no monitor
  4. Verificar timers de aparecer/desaparecer
  5. Criar pedido e verificar ocultação
- [ ] **Console**: Sem erros JavaScript

---

## 🐛 8. Correção: Alertas no Sidebar

- [ ] **Localização**: Sidebar > NotificationCenter (topo)
- [ ] **Problema**: Alertas reaparecem após clicar em OK/Limpar
- [ ] **Solução Esperada**:
  - [ ] Ao clicar em OK, remover do estado global
  - [ ] Remover do banco de dados (se aplicável)
  - [ ] Não reaparecer no reload
- [ ] **Teste Manual**:
  1. Gerar um alerta
  2. Clicar em OK
  3. Recarregar a página
  4. Verificar que alerta não reaparece
- [ ] **Console**: Sem erros JavaScript

---

## 📊 Status Geral

### Implementado ✅
- ✅ Schema do banco de dados (SQL completo)
- ✅ Gestão de Formas de Pagamento
- ✅ Gestão de Máquinas de Cartão
- ✅ Módulo RH completo (Funções, Funcionários, Escalas, Ponto)
- ✅ Rotas e navegação

### Pendente ⚠️
- ⚠️ Sistema de Usuários e Permissões
- ⚠️ Integração PDV (formas de pagamento, preço Ifood, canal de venda)
- ⚠️ Relatórios de Fechamento de Caixa
- ⚠️ Melhoria Visual dos Pedidos
- ⚠️ Configurações do Monitor (Slides)
- ⚠️ Correção bug de Alertas

---

## 🚀 Próximos Passos

1. Implementar sistema de usuários e permissões
2. Integrar formas de pagamento no PDV
3. Implementar preço Ifood no PDV
4. Criar relatórios analíticos de caixa
5. Melhorar interface de pedidos com modal de detalhes
6. Implementar sistema de slides do monitor
7. Corrigir bug de alertas persistentes

---

## 📝 Notas Importantes

- **Database**: Executar `EXECUTAR_NO_SUPABASE.sql` no Supabase SQL Editor
- **Permissões**: Sistema de RLS implementado para todas as tabelas
- **Consistência UI**: Todos os componentes utilizam Shadcn/UI
- **TypeScript**: Tipagem completa em todos os componentes
- **Responsividade**: Layouts responsivos para mobile/desktop
