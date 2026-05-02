# Branching Strategy

## Branches Principais

| Branch | Propósito | Deploy |
|--------|-----------|--------|
| `main` | Produção estável | Vercel Production (auto) |
| `develop` | Integração de features | Vercel Preview (auto) |

## Branches de Trabalho

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `feature/` | Nova funcionalidade | `feature/meal-planner-improvements` |
| `fix/` | Correção de bug | `fix/pwa-cache-stale` |
| `hotfix/` | Fix urgente em produção | `hotfix/login-crash` |
| `chore/` | Manutenção, deps, docs | `chore/update-dependencies` |
| `i18n/` | Traduções e localização | `i18n/wire-calendar-strings` |

## Fluxo de Trabalho

```
feature/xyz  ──PR──►  develop  ──PR──►  main
    │                     │                │
    │                     ▼                ▼
    │              Preview Deploy    Production Deploy
    ▼
  Local dev
```

### 1. Criar branch de trabalho

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature
```

### 2. Desenvolver e commitar

```bash
git add <files>
git commit -m "feat: descrição curta do que foi feito"
```

### 3. Push e Pull Request → develop

```bash
git push -u origin feature/nome-da-feature
gh pr create --base develop --title "feat: descrição" --body "..."
```

### 4. Merge para main (release)

Quando `develop` está estável e testado:

```bash
gh pr create --base main --head develop --title "release: v0.X.0"
```

## Convenção de Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

| Prefixo | Quando usar |
|---------|-------------|
| `feat:` | Nova feature |
| `fix:` | Bug fix |
| `chore:` | Manutenção, deps |
| `docs:` | Documentação |
| `style:` | Formatação (sem alteração de lógica) |
| `refactor:` | Refactoring sem alterar comportamento |
| `perf:` | Melhoria de performance |
| `i18n:` | Traduções |

## Regras

1. **Nunca commitar direto na `main`** — sempre via PR de `develop`
2. **Nunca commitar direto na `develop`** — sempre via PR de branch de trabalho
3. **Hotfixes** são a exceção: branch de `main`, PR para `main`, depois cherry-pick para `develop`
4. **Delete branch** após merge do PR
5. **Squash merge** para PRs de feature (manter histórico limpo na develop)
6. **Merge commit** de develop → main (preservar histórico de release)

## Proteções Recomendadas (GitHub)

### Branch `main`
- ✅ Require PR before merge
- ✅ Require 1 approval (ou self-approve para solo dev)
- ✅ Require status checks (build + typecheck)
- ❌ Allow force push

### Branch `develop`
- ✅ Require PR before merge
- ✅ Require status checks (build + typecheck)
- ❌ Allow force push

## Versionamento

Seguir [SemVer](https://semver.org/):

- **MAJOR** (1.0.0) — breaking changes, redesign total
- **MINOR** (0.7.0) — nova feature
- **PATCH** (0.6.1) — bug fix

Versão atual: **v0.6.0**

## Setup Inicial

```bash
# Criar branch develop a partir de main
git checkout main
git checkout -b develop
git push -u origin develop

# Configurar Vercel preview para develop
# (automático se o projeto Vercel está ligado ao repo)
```
