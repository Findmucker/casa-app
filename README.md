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

## Tech Stack

- **Framework:** Next.js 16.2.4 (App Router, Turbopack)
- **UI:** Tailwind CSS v4, design pink/purple/rose
- **Database:** Firebase Firestore (real-time sync)
- **Weather:** Open-Meteo API (grátis, sem API key)
- **Deploy:** Vercel (conectado ao GitHub, auto-deploy)
- **Auth:** PIN + owner picker (localStorage)

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
3. (Opcional) Ativar Cloud Messaging para push notifications

### 4. Correr localmente

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
casa-app/
├── app/
│   ├── page.tsx              # Entrada: PIN → Owner → Dashboard
│   ├── dashboard/page.tsx    # Dashboard principal com todas as tabs
│   ├── eventos/[shareId]/    # Página pública de eventos (partilha)
│   ├── api/alarms/check/     # Endpoint cron para verificar alarmes
│   └── globals.css           # Animações e estilos globais
├── components/
│   ├── EventList.tsx         # Gestão de eventos + meteorologia
│   ├── PriorityList.tsx      # Coisinhas (tarefas pequenas)
│   ├── ProjectList.tsx       # Projetinhos (projetos grandes)
│   ├── ShoppingList.tsx      # Comprinhas (lista de compras)
│   ├── MaintenancePanel.tsx  # Painel de manutenção/utilitários
│   ├── Weather.tsx           # Previsão meteorológica
│   ├── Greeting.tsx          # Saudação personalizada
│   ├── OwnerPicker.tsx       # Seleção Eduardo/Moniquinha
│   ├── PinScreen.tsx         # Ecrã de PIN
│   └── AutocompleteInput.tsx # Input com sugestões
├── lib/
│   ├── firebase.ts           # Config Firebase
│   ├── hooks.ts              # useCollection hook (real-time Firestore)
│   ├── categories.ts         # Categorias + auto-classificação
│   └── share.ts              # Gerar/validar shareId para eventos
└── public/
    └── manifest.json         # PWA manifest
```

## Firestore Collections

| Collection | Descrição |
|---|---|
| `shopping` | Items da lista de compras |
| `priorities_small` | Coisinhas (tarefas pequenas) |
| `priorities_big` | Projetos (tarefas grandes) |
| `events` | Eventos |
| `events/{id}/items` | Items de cada evento (compras + tarefas) |
| `alarms` | Alarmes (descontinuado) |
| `fcm_tokens` | Tokens FCM (descontinuado) |
| `config/events-share` | ShareId para link público |
| `config/pin` | PIN de acesso |

## Deploy

O projeto está ligado ao Vercel via GitHub. Cada push para `master` faz deploy automático.

```bash
# Deploy manual (se necessário)
npx vercel --prod
```

## Licença

Projeto pessoal — feito com 💕

## Roadmap / TODO

- 🔔 **Notificações push** — alertar quando items são adicionados ou eventos criados
- 📍 **Location-based notifications** — lembrar comprinhas quando perto do supermercado
- 🤖 **Assistant Moniquinha** — assistente personalizada para a app
- 👤 **Utilizadores/Autenticação** — sistema de auth real (Firebase Auth, contas, permissões)
