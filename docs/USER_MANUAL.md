# A Nossa Casinha - Manual do Utilizador

## O que e a app?

A Nossa Casinha e uma app de gestao domestica para casais e familias. Permite organizar compras, tarefas, habitos, despesas, refeicoes, eventos e muito mais — tudo partilhado entre os membros da casa, com notificacoes push reais e um sistema de gamificacao RPG completo.

---

## Navegacao

A app tem uma **barra de tabs** na parte inferior com 10 seccoes. Podes navegar por:
- **Tap** na tab desejada
- **Swipe** horizontal para avancar/recuar entre tabs
- **Menu central** (tap no titulo "A Nossa Casinha") para ver todas as opcoes

### Tabs disponiveis

| Emoji | Nome | Funcao |
|-------|------|--------|
| ✨ | Inicio | Dashboard com resumo semanal |
| 🛒 | Comprinhas | Lista de compras partilhada |
| 🪴 | Coisinhas | Pequenas tarefas/prioridades |
| 🏠 | Projetinhos | Projetos maiores da casa |
| 💊 | Rotinazinhas | Habitos diarios com streaks e filtros |
| 💰 | Gastinhos | Financas: despesas, rendimentos, poupancas |
| 🍽️ | Receitinhas | Planeamento de refeicoes semanal |
| 📅 | Calendarzinho | Calendario mensal integrado |
| 🎉 | Eventinhos | Eventos e planos partilhados |
| 🌤️ | Tempinho | Previsao meteorologica 7 dias |

---

## Dashboard (Inicio)

O ecra inicial mostra:
- **Progresso semanal** — percentagem de tarefas feitas esta semana
- **Alertas urgentes** — comprinhas marcadas como urgentes
- **Habitos de hoje** — quantos habitos ja fizeste hoje + streak
- **Cards resumo** — comprinhas pendentes, coisinhas, projetos em progresso, gastos do mes
- **Acesso rapido** — botoes para refeicoes, calendario, eventos e meteo

---

## Comprinhas (Lista de Compras)

- Adiciona items com o campo de texto no topo
- Marca como **urgente** para destacar no topo
- Items sao agrupados por **categoria** automaticamente (Frescos, Carnes, Frutas, Padaria, Despensa, Bebidas, Snacks, Higiene, Pets)
- Tap num item para marcar como comprado (com animacao de celebracao)
- Categorias colapsaveis com barra de progresso por seccao
- Atribui a pessoa responsavel (membros da casa ou "Ambos")
- Preco estimado opcional
- Ordenado por fluxo de supermercado

---

## Coisinhas (Prioridades)

- Pequenas tarefas do dia-a-dia (Casa, Cozinha, Decoracao, Organizacao, Bricolage, WC, Tech, Jardim, Roupa, Tarefazinhas)
- Auto-categorizacao automatica ao adicionar
- Categorias em caixas colapsaveis com barra de progresso
- Arrasta para reordenar por prioridade
- Atribui a pessoa responsavel + notas em cada item
- Autocomplete com sugestoes baseadas em items anteriores
- Animacao de celebracao ao completar uma categoria inteira

---

## Projetinhos (Projetos)

- Projetos maiores (obras, compras grandes, reparacoes)
- Estados: **pendente** → **a fazer** → **concluido**
- Auto-categorizacao (Pintura, Obras, Portas/Janelas, Eletricidade, Reparacoes, Canalizacao, Cozinha, Exterior, Aquecimento)
- Categorias colapsaveis com contadores de estado
- Cada projeto pode ter subtarefas, notas e orcamento

---

## Rotinazinhas (Habitos)

- Cria habitos diarios (ex: tomar vitaminas, exercicio, medicacao)
- Marca cada dia como feito com check diario (reseta a meia-noite)
- Sistema de **streaks** — dias consecutivos com animacao 🔥
- Hora configuravel por habito (para lembretes)
- **Selector de dias da semana** — define em que dias o habito esta ativo
- **Filtro por pessoa** — filtra habitos por membro (Todos / nome / Ambos)
- **Atribui a pessoa** responsavel (dinamico por membros da casa)
- **Notificacoes repetidas** — lembrete a cada 10 min enquanto nao completo (max 2h)
- **Push notifications reais** — recebe lembretes mesmo com a app fechada (via FCM)
- Pontos de gamificacao por cada check (+2 pontos)

---

## Gastinhos (Financas)

A tab Gastinhos esta organizada em **3 sub-tabs** para gestao financeira completa:

### Sub-tab: Despesas
- Regista gastos com nome, valor, categoria e quem pagou
- Resumo mensal por categoria com barras visuais
- Total por pessoa (membros da casa + "Ambos")
- Navegacao por meses (setas para avancar/recuar)

### Sub-tab: Rendimentos
- Regista entradas de dinheiro (salario, freelance, outros)
- Associa a um membro da casa
- Historico mensal de rendimentos

### Sub-tab: Poupancas
- Define **objetivos de poupanca** (ex: ferias, carro, fundo de emergencia)
- Cada objetivo tem um valor alvo e valor atual
- **Barras de progresso** visuais para acompanhar cada objetivo
- Adiciona contribuicoes ao longo do tempo

### Graficos Visuais
Na seccao de despesas, tens acesso a graficos interativos (SVG puro, sem dependencias externas):
- **Donut chart** — distribuicao de gastos por categoria (cores por tipo)
- **Bar chart** — historico de gastos dos ultimos 6 meses
- **Split rings** — visualizacao da divisao de gastos entre membros da casa

Os graficos atualizam automaticamente com os dados do mes selecionado.

---

## Receitinhas (Planeamento de Refeicoes)

- Planeia refeicoes para 7 dias numa vista semanal
- Slots: Pequeno-almoco, Almoco, Jantar, Snack
- Botao para enviar ingredientes direto para as Comprinhas
- Autocomplete com refeicoes ja usadas anteriormente

---

## Calendarzinho

- Vista mensal com grid interativo
- **Dots coloridos** por tipo de atividade no dia:
  - 🟢 Verde — habitos completados
  - 🩷 Rosa — coisinhas concluidas
  - 🟣 Roxo — projetos concluidos
  - 🔴 Vermelho — eventos agendados
  - 🟡 Amarelo — feriados portugueses
- **Feriados portugueses** automaticos (fixos + moveis como Pascoa e Carnaval)
- **Previsao meteorologica** — emoji do tempo nos proximos 7 dias diretamente no grid
- Tap num dia para ver todos os detalhes:
  - Card de meteo com temperatura min/max e probabilidade de chuva
  - Lista de eventos, habitos, coisinhas e projetos desse dia
  - Feriados e datas especiais
- Legenda de cores na vista inicial

---

## Eventinhos

- Cria eventos com titulo, data e numero de participantes
- Lista de compras e tarefas especificas por evento
- Atribui responsaveis a cada item do evento
- **Previsao meteo automatica** para eventos nos proximos 7 dias
- **Partilha com amigos** via link publico:
  - Amigos registam-se com nome
  - Veem detalhes do evento e podem juntar-se
  - Confirmacao antes de participar
- Historico de eventos passados com opcao de clonar
- **Integrado no Calendarzinho** — eventos aparecem como dots vermelhos

---

## Tempinho (Meteorologia)

- Previsao a 7 dias via Open-Meteo API (gratuita)
- Temperatura, vento, precipitacao
- Vista horaria expandivel por dia (tap para expandir)
- **Integrada no Calendarzinho** — emoji do tempo visivel no grid
- **Integrada nos Eventinhos** — previsao automatica para eventos proximos

---

## Notificacoes Push

A app suporta **notificacoes push reais** via Firebase Cloud Messaging (FCM):

### Ativar notificacoes
1. Vai a tab **Rotinazinhas**
2. Toca no botao 🔔 no topo
3. Aceita a permissao do browser
4. Pronto! Recebes notificacoes mesmo com a app fechada

### Tipos de notificacao
- **Lembretes de habitos** — recebe lembrete na hora configurada
- **Mensagens de membros** — recebe mensagens enviadas por outros membros da casa

### Enviar mensagem a outro membro
1. Tap no titulo "A Nossa Casinha" no header
2. Tap em **💌 Mensagem**
3. Escolhe uma mensagem rapida ou escreve a tua
4. O outro membro recebe uma notificacao push com a tua mensagem

### Mensagens rapidas disponiveis
- ❤️ Amo-te!
- 🏠 Estou a caminho de casa
- 🛒 Vou ao supermercado, precisas de algo?
- 🍽️ O jantar esta pronto!
- 💊 Nao te esquecas da pilula!
- 🐱 O gato precisa de comer
- ☕ Queres um cafe?
- 🧹 Ja limpei a cozinha!

---

## Menu Central

Ao tocar no titulo "A Nossa Casinha" no header, abre um menu organizado em seccoes:

### Navegar
Grid com todas as 10 tabs — tap para ir directamente.

### Comunicacao
- **💌 Mensagem** — envia notificacao push com mensagem ao outro membro
- **📜 Historico** — registo de items completados com data e stats

### Casa
- **🔗 Convidar** — gerar codigo de convite para novos membros
- **👥 Membros** — ver todos os membros com avatar, nivel e stats

### Definicoes
- **⚙️ Manutencao** — reorganizar categorias, limpar items feitos, seed de teste
- **🌐 Idioma** — toggle inline PT 🇵🇹 / EN 🇬🇧
- **❓ Tutorial** — rever o tutorial interativo da app

### Sair
Botao isolado para logout seguro.

---

## Perfil e Gamificacao

Acede ao perfil tocando no icone ⚔️ no canto superior direito.

### Avatar Pixel Art
- Escolhe entre 11 animais (Panda, Gatinho, Coelhinho, Raposa, Ursinho, Caozinho, Pinguim, Hamster, Coala, Coruja, Sapinho)
- Animacoes idle unicas por animal (munch, groom, hop, sly, sleepy, excited, waddle, nibble, blink, croak)
- 6 tabs de customizacao: Animal, Olhos, Boca, Roupa Cima, Roupa Baixo, Acessorios (7 opcoes cada)
- Sombras realisticas por peso do animal
- Avatar exibido no header do perfil

### Sistema RPG
- **Pontos** ganhos ao completar tarefas (+1 compra, +2 coisinha, +5 projeto, +2 habito)
- **Nivel** sobe a cada 50 pontos
- **Titulo** baseado no nivel — desde "Aprendiz da Casa" (Nv.1) ate "Divindade do Lar" (Nv.30)
- **Atributos** calculados automaticamente:
  - STR (Forca): projetos concluidos
  - INT (Inteligencia): coisinhas feitas
  - DEX (Destreza): comprinhas feitas
  - CHA (Carisma): total de tarefas
  - VIT (Vitalidade): habitos feitos
  - LCK (Sorte): melhor streak

### Badges (9 conquistaveis)
Primeiro Passo, Em Chamas, Imparavel, Lenda, Compradora, Faz-Tudo, Arquiteto, Centenario, Top Scorer.

### Equipamento (6 slots)
- 🗡️ Espada do Construtor — 3 projetinhos
- 🛡️ Escudo da Consistencia — 10 dias streak
- 👑 Coroa Real — nivel 10
- 🧤 Luvas do Faz-Tudo — 50 coisinhas
- 👟 Botas do Maratonista — 30 comprinhas
- 💍 Anel da Comunidade — 100 pontos

### Loot Boxes
- Ganha 1 caixa por cada 50 pontos
- 30 items cosmeticos em 6 slots (cabeca, arma, escudo, corpo, pes, acessorio)
- 4 raridades: Comum (50%), Raro (30%), Epico (15%), Lendario (5%)
- Animacao de abertura: shake → explosao → reveal
- Duplicados convertidos em XP (Lendario: 50, Epico: 30, Raro: 15, Comum: 5)

### Inventario WoW TBC-style
- Grid com filtro por slot
- Drag-and-drop para equipar items no avatar

---

## Pesquisa Global

- Toca no icone 🔍 no canto superior esquerdo
- Escreve 2+ letras para pesquisar em todas as tabs de uma vez
- Resultados agrupados por tipo (comprinhas, coisinhas, projetos, habitos, despesas)
- Tap num resultado para navegar direto para a tab correspondente

---

## Historico

- Acessivel via menu central → 📜 Historico
- Lista de todos os items completados com data
- Stats por categoria (comprinhas, coisinhas, projetos)
- Mostra os ultimos 50 items completados

---

## Temas Visuais

A app muda automaticamente de tema ao longo do dia:

| Periodo | Tema | Cores |
|---------|------|-------|
| 7h - 12h | ☀️ Manha | Amber, amarelo, laranja quente |
| 12h - 18h | 🌤️ Tarde | Rosa, roxo, rose (default) |
| 18h - 20h | 🌅 Anoitecer | Laranja, rose, roxo |
| 20h - 7h | 🌙 Noite | Modo escuro, slate, purple |

A transicao entre temas e suave e automatica.

---

## Membros da Casa

Na seccao Membros podes ver:
- Avatar pixel art de cada membro
- Nivel e titulo RPG
- Pontos totais
- Melhor streak
- Role (admin/membro)

### Convidar novos membros
1. Menu central → 🔗 Convidar
2. Gera um codigo de convite
3. Partilha o link com o novo membro
4. O membro aceita e junta-se automaticamente a casa

---

## Manutencao

Acessivel via menu central → ⚙️ Manutencao:
- **Reorganizar categorias** — reclassifica automaticamente todos os items
- **Limpar comprinhas feitas** — remove items ja comprados
- **Limpar coisinhas feitas** — remove tarefas ja concluidas
- **Migrar dados** — copia dados antigos para a casa atual (se aplicavel)
- **Seed dados de teste** — preenche com dados exemplo (dev only)
- **Sair do modo teste** — limpa dados de teste e reseta stats

---

## Idioma / Language

A app suporta **Portugues** 🇵🇹 e **Ingles** 🇬🇧.

### Mudar o idioma
- **Na pagina de login:** botoes PT/EN no canto superior direito
- **No menu central:** seccao Definicoes → toggle inline PT | EN
- A escolha e guardada automaticamente (persiste entre sessoes)

---

## Dicas

- **Swipe** entre tabs para navegar rapidamente
- **Marca items como urgentes** nas comprinhas para destacar no topo
- **Mantem streaks** nos habitos para ganhar mais pontos e badges
- **Usa o planeador de refeicoes** e envia ingredientes direto para as comprinhas
- O **dashboard** mostra o que e mais importante para hoje
- **Ativa notificacoes** para nao perderes lembretes de habitos
- **Envia mensagens** ao outro membro diretamente pela app
- O **calendario** mostra uma visao geral de tudo o que acontece na casa

---

## PWA e Atualizacoes

A app funciona como **Progressive Web App (PWA)** — podes instala-la no telemovel ou computador.

### Instalar a app
- **Android/Chrome:** Menu do browser → "Instalar app" ou "Adicionar ao ecra inicial"
- **iOS/Safari:** Botao de partilha → "Adicionar ao ecra inicial"

### Atualizacoes automaticas
- O **service worker** usa `skipWaiting` + **cache purge** para garantir que recebes sempre a versao mais recente
- Quando ha uma atualizacao, a app carrega automaticamente a nova versao na proxima visita
- Nao precisas de fazer nada — as atualizacoes sao transparentes e fiaveis

---

## Suporte

Problemas ou sugestoes? Contacta os administradores da casinha ou abre um issue no [repositorio do projeto](https://github.com/Findmucker/casa-app).
