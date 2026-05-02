# 🏡 A Nossa Casinha

App de gestão de casa para casais — organiza compras, tarefas, projetos, eventos e mais. Feito com amor pelo Eduardo & Moniquinha.

**Live:** [casa-app-zeta.vercel.app](https://casa-app-zeta.vercel.app)

## Funcionalidades

### 🛒 Comprinhas (Lista de Compras)
- Adicionar/remover items com preço estimado
- Atribuir a pessoa (Eduardo, Moniquinha, ou Ambos)
- Marcar como comprado com animação de celebração
- **Auto-categorização** por tipo (Frescos, Carnes, Frutas, Padaria, Despensa, Bebidas, Snacks, Higiene, Pets)
- Categorias colapsáveis com progress tracker por secção
- Ordenado por fluxo de supermercado
- Marcar items como urgentes (aparecem no topo)

### 🪴 Coisinhas (Tarefas pequenas)
- Auto-categorização (Casa, Cozinha, Decoração, Organização, Bricolage, WC, Tech, Jardim, Roupa, Tarefazinhas)
- Categorias em caixas colapsáveis com progresso
- Priorização por ordem (mover cima/baixo)
- Atribuir a pessoa + notas em cada item
- Autocomplete com sugestões
- Animações de celebração ao completar categorias

### 🏠 Projetinhos (Projetos grandes)
- Auto-categorização (Pintura, Obras, Portas/Janelas, Eletricidade, Reparações, Canalização, Cozinha, Exterior, Aquecimento)
- Status: Pendente → A fazer → Feito
- Subtarefas, orçamento, notas detalhadas
- Categorias colapsáveis com contadores de estado

### ⚙️ Manutenção
- Reorganizar categorias automaticamente
- Limpar comprinhas/coisinhas já concluídas
- Acessível via menu do dashboard (tap no título)

### 💊 Rotinazinhas (Hábitos diários)
- Check diário que reseta à meia-noite
- Streak counter com 🔥 e animações
- Hora configurável por hábito
- **Selector de dias da semana** — define em que dias o hábito é ativo
- **Filtro por pessoa** — filtra hábitos por membro da casa
- **Atribuir a pessoa** (dinâmico por membros da casa)
- **Notificações repetidas** — lembrete a cada 10 min enquanto não completo
- Push notifications (com permissão)

### 💰 Gastinhos (Despesas)
- Tracking simples: nome, valor, categoria, quem pagou
- Resumo mensal por categoria (com barras visuais)
- Total por pessoa (Eduardo/Moniquinha/Ambos)
- Navegação por meses

### 🍽️ Receitinhas (Plano de refeições)
- Vista semanal (7 dias)
- Slots: Pequeno-almoço, Almoço, Jantar, Snack
- Enviar ingredientes direto para as Comprinhas
- Autocomplete com refeições passadas

### 📅 Calendarzinho
- Vista mensal com grid interativo
- Dots coloridos por tipo: 🟢 hábitos, 🩷 coisinhas, 🟣 projetos, 🔴 eventos, 🟡 feriados
- **Feriados portugueses** automáticos (fixos + Páscoa/Carnaval)
- Datas especiais (Dia dos Namorados, Natal, etc.)
- **Integração meteorológica** — emoji do tempo nos próximos 7 dias diretamente no grid
- **Integração de eventos** — eventos aparecem como dots vermelhos no dia correspondente
- Tap num dia para ver detalhes: tempo, eventos, hábitos, coisinhas, projetos, feriados
- Card de meteorologia com temperatura min/max e probabilidade de precipitação

### ✨ Dashboard Resumo
- Cards com status de todas as áreas
- Barra de progresso semanal
- Acesso rápido a cada secção

### ❓ Tutorial
- Tutorial interativo passo-a-passo na primeira utilização
- Acessível a qualquer momento via menu
- Explica todas as funcionalidades da app

### 🏆 Gamificação & Perfil RPG
- Sistema de pontos (+1 compra, +2 coisinha, +5 projeto, +2 hábito)
- Níveis (cada 50 pontos) com títulos progressivos
- 9 badges desbloqueáveis
- **Perfil RPG** com ficha de personagem completa
  - 6 atributos (STR, INT, DEX, CHA, VIT, LCK) baseados em atividade real
  - 6 equipamentos desbloqueáveis por conquistas
  - Sistema de loot aleatório (common/rare/epic/legendary)
  - Level-up com notificação e recompensas
- Streak tracking
- **Loot Boxes** — 1 caixa por cada 50 pontos
  - 30 items cosméticos em 6 slots (cabeça, arma, escudo, corpo, pés, acessório)
  - 4 raridades com pesos: Comum (50%), Raro (30%), Épico (15%), Lendário (5%)
  - Animação de abertura com shake → explosão → reveal
  - **Duplicados** convertidos em XP (Lendário: 50, Épico: 30, Raro: 15, Comum: 5)
- **Inventário WoW TBC-style** — grid com filtro por slot, drag-and-drop para equipar
- **Avatar 8-bit Pixel Art** — personagem pixel art fofo com customização completa
  - 11 animais disponíveis (Panda, Gatinho, Coelhinho, Raposa, Ursinho, Cãozinho, Pinguim, Hamster, Coala, Coruja, Sapinho)
  - Animações idle únicas por animal (munch, groom, hop, sly, sleepy, excited, waddle, nibble, blink, croak)
  - Sombras realistas por peso do animal
  - 6 tabs de customização: Animal, Olhos, Boca, Roupa Cima, Roupa Baixo, Acessórios (7 opções cada)
  - Panda com representação 8-bit pixel art detalhada (16x20 grid)
  - Avatar exibido no header do perfil

#### Como funciona a Gamificação

| Ação | Pontos |
|------|--------|
| Completar comprinha | +1 |
| Completar coisinha | +2 |
| Completar projetinho | +5 |
| Check de hábito | +2 |
| 5 dias de streak | +10 |
| 10 dias de streak | +25 |
| 30 dias de streak | +100 |

**Níveis:** Cada 50 pontos = 1 nível. Títulos progressivos desde "Aprendiz da Casa" (Nv.1) até "Divindade do Lar" (Nv.30).

**Badges (9):** Primeiro Passo, Em Chamas, Imparável, Lenda, Compradora, Faz-Tudo, Arquiteto, Centenário, Top Scorer.

**Equipamento desbloqueável (6 slots):**
- 🗡️ Espada do Construtor — 3 projetinhos
- 🛡️ Escudo da Consistência — 10 dias streak
- 👑 Coroa Real — nível 10
- 🧤 Luvas do Faz-Tudo — 50 coisinhas
- 👟 Botas do Maratonista — 30 comprinhas
- 💍 Anel da Comunidade — 100 pontos

**Loot Boxes:** A cada 50 pontos ganhas uma caixa. Ao abrir recebes um item cosmético aleatório que podes equipar no teu personagem. Items disponíveis por slot:
- 🎩 Cabeça: Coroa de Flores, Orelhas de Coelho, Tiara Estelar, Coroa Real, Auréola Divina
- ⚔️ Arma: Vassoura Mágica, Espátula de Chef, Varinha Fofinha, Martelo Dourado, Tridente Lendário
- 🛡️ Escudo: Escudo de Bolacha, Escudo Folha, Escudo do Amor, Escudo Cristal, Escudo Arco-Íris
- 👗 Corpo: Avental Fofo, Camisola Quentinha, Capa de Super-Herói, Armadura de Diamante, Armadura de Dragão
- 👟 Pés: Pantufas Fofas, Botas de Jardim, Botas de Velocidade, Botas de Nuvem, Botas Foguete
- 💍 Acessório: Sininho, Gatinho de Ombro, Borboleta Mágica, Fadinha Ajudante, Fénix Miniatura

### 🌐 Localização (i18n)
- Suporte Português 🇵🇹 e Inglês 🇬🇧
- Toggle de idioma na página de login (primeira visita)
- Toggle inline no menu central do dashboard
- Persistência em localStorage
- Todas as strings da UI traduzidas

### 🔍 Pesquisa Global
- Buscar em todas as tabs de uma vez
- Resultados agrupados por tipo

### 💌 Mensagens entre Membros
- Enviar notificação push com mensagem ao outro membro da casa
- 8 mensagens rápidas pré-definidas (amor, supermercado, jantar, etc.)
- Mensagem personalizada com input livre
- Acessível via menu central (💌 Mensagem)

### 📜 Histórico
- Items completados com data
- Stats por categoria

### 🎉 Eventos
- Criar eventos com data e participantes
- Lista de compras e tarefas por evento
- Atribuir responsáveis a cada item
- Meteorologia automática para eventos com data (próximos 7 dias)
- **Partilha com amigos** via link público
  - Amigos registam-se com nome
  - Vêem eventos, podem juntar-se e colaborar
  - Confirmação com detalhes do evento antes de participar
- Histórico de eventos passados com opção de clonar

### 🌤️ Meteorologia
- Previsão a 7 dias (Open-Meteo API)
- Temperatura, vento, precipitação
- Vista horária expandível por dia
- **Integrada no Calendário** — emoji do tempo visível no grid
- **Integrada nos Eventos** — previsão automática para eventos próximos

## Tech Stack

- **Framework:** Next.js 16.2.4 (App Router, Turbopack)
- **UI:** Tailwind CSS v4, design pink/purple/rose
- **Database:** Firebase Firestore (real-time sync)
- **Weather:** Open-Meteo API (grátis, sem API key)
- **Deploy:** Vercel (conectado ao GitHub, auto-deploy)
- **Auth:** Firebase Auth (email/password + Google login)
- **Multi-tenant:** Cada casa tem dados isolados, convites por link
- **Nomes dinâmicos:** Assignees e payers adaptam-se aos membros da casa

## Setup Local

### 1. Clonar e instalar

```bash
git clone https://github.com/Findmucker/my_projects.git
cd my_projects
npm install
```

### 2. Configurar variáveis de ambiente

Criar ficheiro `.env.local`:

```env
# Firebase (obrigatório)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Configurar Firebase

1. Criar projeto no [Firebase Console](https://console.firebase.google.com)
2. Ativar Firestore Database
3. Ativar Authentication → Sign-in methods: Email/Password + Google
4. (Opcional) Ativar Cloud Messaging para push notifications

### 4. Correr localmente

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### 5. Testes

```bash
npm test              # Correr todos os testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
npm run typecheck     # Verificar tipos TypeScript
```

## Estrutura do Projeto

```
casa-app/
├── app/
│   ├── page.tsx              # Entrada: Auth → House Setup → Dashboard
│   ├── dashboard/page.tsx    # Dashboard principal com todas as tabs
│   ├── convite/[code]/       # Página pública para aceitar convites
│   ├── api/send-notification/ # POST endpoint para enviar push FCM
│   ├── api/cron/habits/      # Cron endpoint para lembretes de hábitos
│   └── globals.css           # Animações e estilos globais
├── components/
│   ├── AuthScreen.tsx        # Login/registo (email + Google)
│   ├── HouseSetup.tsx        # Criar casa ou aceitar convite
│   ├── InvitePanel.tsx       # Gerar códigos de convite
│   ├── Greeting.tsx          # Saudação personalizada
│   ├── EventList.tsx         # Gestão de eventos + meteorologia
│   ├── PriorityList.tsx      # Coisinhas (tarefas pequenas)
│   ├── ProjectList.tsx       # Projetinhos (projetos grandes)
│   ├── ShoppingList.tsx      # Comprinhas (lista de compras)
│   ├── HabitList.tsx         # Rotinazinhas (hábitos diários)
│   ├── ExpenseList.tsx       # Gastinhos (despesas)
│   ├── MealPlanner.tsx       # Receitinhas (plano refeições)
│   ├── Calendar.tsx          # Calendarzinho (vista mensal)
│   ├── DashboardSummary.tsx  # Resumo com cards e progresso
│   ├── Gamification.tsx      # Pontos, níveis, badges (legacy)
│   ├── ProfilePage.tsx       # Perfil RPG completo + inventário + avatar
│   ├── AvatarBuilder.tsx     # Avatar 8-bit pixel art + customização Genshin-style
│   ├── CharacterModel.tsx    # Boneco chibi com loot equipado (fallback)
│   ├── Inventory.tsx         # Grid de inventário com drag-and-drop
│   ├── LootBoxOpener.tsx     # Abertura animada de loot boxes
│   ├── Tutorial.tsx          # Tutorial interativo da app
│   ├── SearchOverlay.tsx     # Pesquisa global
│   ├── SendMessagePanel.tsx  # Enviar mensagem push a membros
│   ├── HistoryPanel.tsx      # Histórico de completados
│   ├── MaintenancePanel.tsx  # Painel de manutenção/utilitários
│   ├── Weather.tsx           # Previsão meteorológica
│   ├── FloatingCuties.tsx    # Animações decorativas
│   └── AutocompleteInput.tsx # Input com sugestões
├── lib/
│   ├── firebase.ts           # Config Firebase + Auth
│   ├── auth.ts               # Hooks de auth + house operations
│   ├── context.tsx           # HouseProvider context
│   ├── hooks.ts              # useCollection hook (real-time, house-scoped)
│   ├── i18n.tsx              # LocaleProvider + useT hook
│   ├── locales/
│   │   ├── pt.ts             # Dicionário Português
│   │   └── en.ts             # Dicionário Inglês
│   ├── categories.ts         # Categorias + auto-classificação
│   ├── gamification.ts       # Sistema de pontos + badges + loot boxes + inventário
│   ├── seed.ts               # Dados de teste (seed/reset modo teste)
│   ├── notifications.ts      # Push notifications + lembretes
│   ├── weather.ts            # WMO weather codes + getWeatherInfo (shared)
│   └── share.ts              # Gerar/validar shareId para eventos
└── public/
    └── manifest.json         # PWA manifest
```

## Firestore Collections

| Collection | Descrição |
|---|---|
| `users/{uid}` | Perfil do utilizador (nome, email, houseId) |
| `houses/{houseId}` | Casa (nome, membros) |
| `invites/{code}` | Convites pendentes |
| `houses/{houseId}/shopping` | Items da lista de compras |
| `houses/{houseId}/priorities_small` | Coisinhas (tarefas pequenas) |
| `houses/{houseId}/priorities_big` | Projetos (tarefas grandes) |
| `houses/{houseId}/events` | Eventos |
| `houses/{houseId}/habits` | Hábitos/rotinas configurados |
| `houses/{houseId}/habit_checks` | Checks diários de hábitos |
| `houses/{houseId}/expenses` | Despesas/gastos |
| `houses/{houseId}/meal_plans` | Plano de refeições por dia |
| `houses/{houseId}/gamification` | Pontos, badges, stats |
| `gamification/{owner}` | Perfil RPG: pontos, inventário, equipped, avatar, lootBoxes |
| `fcm_tokens/{owner}` | Tokens FCM para push notifications |

## Deploy

O projeto está ligado ao Vercel via GitHub. Cada push para `master` faz deploy automático.

```bash
# Deploy manual (se necessário)
npx vercel --prod
```

## Licença

Projeto pessoal — feito com 💕

## Roadmap / TODO

### ✅ Concluído recentemente
- 🌐 Localização PT/EN com toggle na login e menu
- 🔔 Notificações repetidas a cada 10 min nos hábitos
- 📅 Selector de dias da semana nos hábitos
- 👤 Filtro por pessoa nos hábitos
- 📂 Menu reestruturado em secções (Comunicação, Casa, Definições)
- ♿ Aria-labels e keyboard navigation ([#48](https://github.com/Findmucker/casa-app/issues/48))
- 🔔 Push notifications reais — FCM ([#66](https://github.com/Findmucker/casa-app/issues/66))
- 💬 Enviar notificação entre membros ([#23](https://github.com/Findmucker/casa-app/issues/23))
- 🎂 Data de nascimento obrigatória no registo ([#72](https://github.com/Findmucker/casa-app/issues/72))

### UX & Interação
- 🖐️ Drag & drop nas listas ([#55](https://github.com/Findmucker/casa-app/issues/55))
- ↩️ Undo ao apagar items ([#56](https://github.com/Findmucker/casa-app/issues/56))
- 👆 Swipe to complete ([#57](https://github.com/Findmucker/casa-app/issues/57))

### Temas & Personalização
- 🎀 Tema Fofinho melhorado ([#33](https://github.com/Findmucker/casa-app/issues/33))
- 💀 Tema Dark Spooky ([#32](https://github.com/Findmucker/casa-app/issues/32))
- 🤖 Tema Cyberpunk ([#34](https://github.com/Findmucker/casa-app/issues/34))
- 🌿 Tema Nature Magical ([#35](https://github.com/Findmucker/casa-app/issues/35))
- 🎨 Temas customizáveis e desbloqueáveis ([#67](https://github.com/Findmucker/casa-app/issues/67))

### Finanças
- 💰 Reestruturar tab Gastinhos: Despesas + Poupanças + Rendimentos ([#36](https://github.com/Findmucker/casa-app/issues/36))
- 📊 Gráficos visuais para tab Gastinhos ([#37](https://github.com/Findmucker/casa-app/issues/37))

### Hábitos & Rotinas
- 📊 Heatmap visual de hábitos estilo GitHub ([#58](https://github.com/Findmucker/casa-app/issues/58))

### Gamificação
- 🐾 Pet virtual ([#60](https://github.com/Findmucker/casa-app/issues/60))
- ⚔️ Daily quests ([#61](https://github.com/Findmucker/casa-app/issues/61))
- 🏅 Conquistas secretas ([#62](https://github.com/Findmucker/casa-app/issues/62))

### Casa & Gestão
- ⏰ Countdown para eventos ([#59](https://github.com/Findmucker/casa-app/issues/59))
- 🔧 Lembretes de manutenção da casa ([#63](https://github.com/Findmucker/casa-app/issues/63))
- 📞 Lista de contactos úteis ([#64](https://github.com/Findmucker/casa-app/issues/64))
- 💍 Tracker de aniversários e datas especiais ([#69](https://github.com/Findmucker/casa-app/issues/69))
- 👯 Lista de casa de amigas ([#70](https://github.com/Findmucker/casa-app/issues/70))
- 🔄 Sync de calendários de aniversários com amigos ([#71](https://github.com/Findmucker/casa-app/issues/71))
- 🎂 Calcular aniversários automáticos por data de nascimento ([#73](https://github.com/Findmucker/casa-app/issues/73))

### Avatares / Customização
- 👕 Tab Roupa Cima - 7 estilos ([#15](https://github.com/Findmucker/casa-app/issues/15))
- 👖 Tab Roupa Baixo - 7 estilos ([#16](https://github.com/Findmucker/casa-app/issues/16))
- 🎩 Tab Acessórios - 7 estilos ([#17](https://github.com/Findmucker/casa-app/issues/17))
- ✨ Skins para animais avatar ([#21](https://github.com/Findmucker/casa-app/issues/21))

### Técnico / Infra
- 📱 PWA completa ([#65](https://github.com/Findmucker/casa-app/issues/65))
- 📲 Widgets para home screen ([#68](https://github.com/Findmucker/casa-app/issues/68))

### Features
- 🏠 Título da casa customizável ([#39](https://github.com/Findmucker/casa-app/issues/39))
- ❓ Melhorar Tutorial ([#38](https://github.com/Findmucker/casa-app/issues/38))
- 📍 Location-based notifications ([#18](https://github.com/Findmucker/casa-app/issues/18))
- 🤖 Assistant Moniquinha ([#19](https://github.com/Findmucker/casa-app/issues/19))
