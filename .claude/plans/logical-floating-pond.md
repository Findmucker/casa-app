# Push Notifications Reais via Vercel Cron

## Contexto
As rotinas mandam notificação client-side (só com app aberta). Precisamos de push notifications reais que funcionem com app fechada, para 4-5 casas.

## Estado Actual — JÁ IMPLEMENTADO
A infraestrutura já existe:
- `app/api/cron/habits/route.ts` — API route completa que lê hábitos, verifica checks, envia FCM
- `app/api/send-notification/route.ts` — endpoint genérico para enviar notificações
- `vercel.json` — cron configurado (actualmente `"0 8 * * *"`, só 1x/dia às 8h)
- `firebase-admin` instalado no package.json
- FCM tokens salvos em `fcm_tokens/{memberName}`

## O que falta

### 1. Configurar env vars no Vercel
O Firebase Admin SDK precisa de 3 env vars server-side (não NEXT_PUBLIC_):
```
FIREBASE_PROJECT_ID=casa-66668
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@casa-66668.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

**Passos:**
1. Ir ao Firebase Console → Project Settings → Service Accounts → Generate New Private Key
2. Do JSON baixado, extrair `client_email` e `private_key`
3. No Vercel Dashboard → Settings → Environment Variables → adicionar as 3 vars

### 2. Mudar cron schedule para cobrir mais horários
O Vercel Hobby permite 2 cron jobs. Mudar de 1x/dia para correr em vários horários:

```json
{
  "crons": [
    { "path": "/api/cron/habits", "schedule": "0 7,9,12,15,18,21 * * *" }
  ]
}
```

Isto corre às 7h, 9h, 12h, 15h, 18h, 21h — cobre a maioria dos horários de hábitos.

**NOTA**: No Vercel Hobby o mínimo é 1x/dia. Se o schedule hourly não funcionar, ficamos com `"0 8 * * *"` que cobre manhã.

### 3. Verificar service worker FCM
Ficheiro `public/firebase-messaging-sw.js` precisa de estar configurado para receber push em background.

## Ficheiros a modificar
| Ficheiro | Alteração |
|---|---|
| `vercel.json` | Mudar schedule para múltiplos horários |

## Verificação
1. Configurar env vars no Vercel
2. Deploy
3. Chamar manualmente `GET /api/cron/habits` para testar
4. Verificar que notificação chega no telemóvel com app fechada
