/**
 * 🏠 PÁGINA INICIAL - LANDING PAGE
 *
 * Página pública principal da aplicação
 * - Apenas usuários não logados podem acessar
 * - Links para páginas principais do sistema
 * - Template público com redirecionamento automático
 * - Design simples e funcional para demonstração
 */

import Link from 'next/link'

import RouteGuard from '@/router'

// ====================================================================
// 🚀 COMPONENTE PRINCIPAL
// ====================================================================

/**
 * Página inicial da aplicação
 *
 * Funcionalidades:
 * - Protegida pelo template PublicOnlyFeature
 * - Redireciona usuários logados para /home
 * - Links de navegação para principais seções
 * - Design responsivo e acessível
 *
 * Fluxo de usuário:
 * - Usuário não logado: vê landing page
 * - Usuário logado: redirecionado automaticamente
 *
 * Navegação disponível:
 * - Login: /login
 * - Cadastro: /cadastro
 * - Admin: /admin/users (apenas para demonstração)
 */
export default function Home() {
  return (
    <RouteGuard accessType="public">
      <main className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* ====================================================================
            🎨 CABEÇALHO PRINCIPAL
            ==================================================================== */}

        <div className="space-y-4 text-center">
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Firebase Boilerplate
          </h1>

          <p className="mx-auto max-w-md text-lg text-gray-600 dark:text-gray-300">
            Boilerplate completo com autenticação, templates e gerenciamento de
            usuários
          </p>
        </div>

        {/* ====================================================================
            🧭 NAVEGAÇÃO PRINCIPAL
            ==================================================================== */}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {/* 🔐 Link para Login */}
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-blue-700 hover:shadow-lg"
          >
            Fazer Login
          </Link>

          {/* 📝 Link para Cadastro */}
          <Link
            href="/cadastro"
            className="rounded-lg bg-green-600 px-6 py-3 text-center font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-green-700 hover:shadow-lg"
          >
            Criar Conta
          </Link>
        </div>

        {/* ====================================================================
            🔧 LINK DE DEMONSTRAÇÃO (ADMIN)
            ==================================================================== */}

        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
          <p className="mb-3 text-center text-sm text-gray-500 dark:text-gray-400">
            Demonstração (requer login de admin):
          </p>

          <Link
            href="/admin/home"
            className="block rounded-md bg-purple-100 px-4 py-2 text-center font-medium text-purple-700 transition-all duration-200 hover:scale-105 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
          >
            🛡️ Painel Administrativo
          </Link>
        </div>

        {/* ====================================================================
            🔧 LINK DE DEMONSTRAÇÃO (COMPONENTS)
            ==================================================================== */}

        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
          <p className="mb-3 text-center text-sm text-gray-500 dark:text-gray-400">
            Demonstração :
          </p>

          <Link
            href="/components-examples"
            className="block rounded-md bg-purple-100 px-4 py-2 text-center font-medium text-purple-700 transition-all duration-200 hover:scale-105 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
          >
            Components
          </Link>
        </div>

        {/* ====================================================================
            📊 FEATURES HIGHLIGHT
            ==================================================================== */}

        <div className="mt-12 grid max-w-4xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 text-center shadow-sm dark:bg-gray-800">
            <div className="mb-2 text-2xl">🔐</div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Autenticação
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Firebase Auth completo
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 text-center shadow-sm dark:bg-gray-800">
            <div className="mb-2 text-2xl">👥</div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Templates
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Público, Usuário, Admin
            </p>
          </div>

          <div className="rounded-lg bg-white p-4 text-center shadow-sm dark:bg-gray-800">
            <div className="mb-2 text-2xl">⚡</div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Performance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              React Query + Cache
            </p>
          </div>
        </div>
      </main>
    </RouteGuard>
  )
}
