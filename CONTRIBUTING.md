# Contributing to Casa App

Obrigado por querer contribuir! 🏠✨

## Quick Start

```bash
git clone https://github.com/Findmucker/casa-app.git
cd casa-app
npm install
npm run dev
```

## Workflow

1. **Escolhe um issue** em [GitHub Issues](https://github.com/Findmucker/casa-app/issues)
2. **Cria branch** a partir de `develop`:
   ```bash
   git checkout develop && git pull
   git checkout -b feature/issue-XX-descricao
   ```
3. **Desenvolve** e verifica:
   ```bash
   npm run typecheck  # Zero errors
   npm run lint       # Zero warnings
   npm run build      # Build OK
   ```
4. **Commit** com Conventional Commits:
   ```bash
   git commit -m "feat: add savings progress bar"
   ```
5. **Push e abre PR** para `develop`:
   ```bash
   git push -u origin feature/issue-XX-descricao
   ```

## Convenções

### Branch naming
| Prefixo | Uso |
|---------|-----|
| `feature/` | Nova funcionalidade |
| `fix/` | Bug fix |
| `chore/` | Manutenção, deps |
| `i18n/` | Traduções |
| `docs/` | Documentação |

### Commit messages
Seguir [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add meal planner export`
- `fix: prevent crash on empty habit days`
- `chore: update dependencies`
- `i18n: wire calendar strings`

### PR title
Mesmo formato dos commits. O CI valida automaticamente.

## i18n

Todas as strings visíveis ao user devem usar `t("key")`:
```tsx
import { useT } from "@/lib/i18n";
const { t } = useT();
// ...
<p>{t("expenses.empty")}</p>
```

Adicionar keys em ambos:
- `lib/locales/pt.ts` (Português)
- `lib/locales/en.ts` (English)

## Code Style

- **TypeScript** strict (sem `any`)
- **Tailwind** para estilos (sem CSS custom)
- **Componentes** em `components/` com nome PascalCase
- **Hooks/utils** em `lib/`
- **Firestore types** em `lib/hooks.ts`

## CI/CD

O pipeline corre automaticamente em PRs:
- ✅ TypeScript check
- ✅ ESLint
- ✅ Build
- ✅ Tests
- ✅ PR title validation
- ✅ Auto-labeling
- ✅ PR stats comment

## Dúvidas?

Abre um issue com label `question` ou fala no grupo.
