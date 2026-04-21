# GitHub Copilot Instructions — upsaude-web-2

## BMAD Method (Auto-ativado)
BMAD v6.3.0 instalado globalmente em `C:\Users\rodol\.bmad\_bmad`.  
**Ativar automaticamente** o skill BMAD correspondente em toda solicitação de ação.

### Mapeamento automático
- Implementar/fix/refactor → `bmad-quick-dev`
- Revisar código → `bmad-code-review`
- Criar PRD → `bmad-create-prd`
- Criar arquitetura → `bmad-create-architecture`
- Criar epics/histórias → `bmad-create-epics-and-stories`
- Documentar projeto → `bmad-document-project`
- Brainstorm → `bmad-brainstorming`
- Revisão crítica → `bmad-review-adversarial-general`

## Stack do Projeto
- **Framework**: Next.js 15.3.8 com Turbopack (`npm run dev` na porta 3005)
- **Linguagem**: TypeScript 5.3.3
- **Estilização**: Tailwind CSS v3.4.17 | Cor primária: `#792EBD`
- **Estado**: TanStack Query v5
- **Backend**: Firebase v11.10.0 (Auth + Firestore + Storage)
- **Package manager**: npm (pnpm às vezes indisponível)

## Convenções Firebase (CRÍTICO)
- Importar apenas `firebase/app` → usar `@/config/firebase/app`
- Importar `auth`/`firestore`/`storage` → usar `@/config/firebase/firebase`
- **NUNCA** importar `firebase/analytics`, `firebase/auth`, `firebase/firestore`, `firebase/storage` diretamente em services (causa HMR lento)

## Estrutura de Diretórios
- `src/app/` — Next.js App Router (rotas, layouts)
- `src/components/` — atoms / molecules / organisms / templates / ui
- `src/services/` — acesso ao Firestore (cada service usa `getFirestore(firebaseApp)`)
- `src/hooks/` — React hooks (queries/ e mutations/ para TanStack Query)
- `src/lib/` — utilitários, schedulers, server utils
- `src/types/entities/` — tipos TypeScript

## Padrões de Código
- Componentes: PascalCase, extensão `.tsx`
- Services: camelCase, extensão `.ts`
- Imports absolutos via `@/` (alias configurado em tsconfig.json)
- Comunicação: Português (BR)
