# Polir Tema Fofinho (#33)

## Contexto
O tema atual "fofinho" funciona bem mas pode ser mais polido e consistente. Melhorar gradientes, espaçamentos, micro-interações e coerência visual para um look mais premium e coeso.

## Ficheiros a modificar

| Ficheiro | Alteração |
|---|---|
| `app/globals.css` | Melhorar variáveis, adicionar backdrop-blur, suavizar transições |
| `lib/themes.ts` | Ajustar gradientes para serem mais suaves e harmoniosos |
| `app/dashboard/DashboardClient.tsx` | Melhorar tab bar, header, menu overlay |

## Alterações

### 1. `lib/themes.ts` — Gradientes mais suaves
- **afternoon** (tema principal): `from-rose-50/80 via-pink-50 to-fuchsia-50/60` — mais rosa suave, menos roxo
- **morning**: `from-amber-50/80 via-orange-50/40 to-yellow-50/60` — mais quente e acolhedor
- **dusk**: `from-orange-50 via-rose-100 to-purple-100/80` — sunset mais suave
- **night**: manter `from-pink-100 via-purple-100 to-indigo-100` (já corrigido)

### 2. `app/globals.css` — Melhoramentos visuais
- Adicionar `backdrop-filter: blur(8px)` global nos cards (`.bg-white\/70`)
- Melhorar scrollbar thumb: gradiente rosa em vez de cor fixa
- Adicionar transição suave em todos os border-color
- Suavizar sombras: usar `shadow-sm shadow-pink-100/20` padrão
- Inputs: border radius mais arredondado, focus ring mais suave
- Melhorar `:root` vars para cores mais harmoniosas

### 3. `app/dashboard/DashboardClient.tsx` — Tab bar e header
- Tab bar: adicionar blur no fundo, separador mais suave
- Tab ativa: gradiente no indicador em vez de cor sólida
- Header: texto com gradiente (background-clip) no título
- Menu overlay: glassmorphism mais pronunciado

## Verificação
- `npx tsc --noEmit` passa
- Visualmente: gradientes mais suaves, cards com blur, tab bar premium
- Não quebra nenhum dos 4 temas (morning/afternoon/dusk/night)
- Animações existentes continuam a funcionar
