/**
 * 🏗️ LAYOUT RAIZ DA APLICAÇÃO
 *
 * Layout principal que configura providers globais e estrutura base
 * - Providers de autenticação e dados
 * - Configuração de fonts e estilos globais
 * - Sistema de notificações (Toast)
 * - Inicialização do Firebase
 * - Query Client para cache de dados
 */

import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import { ToastContainer } from 'react-toastify'

import ErrorBoundary from '@/components/atoms/ErrorBoundary/errorBoundary'
import AuthProvider from '@/providers/Auth'
import QueryClientProviderApp from '@/providers/QueryClientApp'
import UserProvider from '@/providers/User'

// ====================================================================
// 🎨 CONFIGURAÇÃO DE FONTES DA MARCA
// ====================================================================

/**
 * Fontes da marca conforme identidade visual:
 * - Poppins (principal)
 * - Roboto
 * - Montserrat
 * - Open Sans
 */

// Fonte secundária - Roboto
const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  display: 'swap',
})

// ====================================================================
// 📄 METADADOS DA APLICAÇÃO
// ====================================================================

/**
 * Metadados SEO e configurações da página
 */
export const metadata: Metadata = {
  title: 'Up Saúde',
  description: 'Up Saúde',
  keywords: ['Up Saúde', 'Next.js', 'React', 'TypeScript', 'Boilerplate'],
  authors: [{ name: 'José Carlos Barros' }],
  icons: {
    icon: [
      { url: '/purple-logo.png', type: 'image/png', sizes: '32x32' },
      { url: '/purple-logo.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/purple-logo.png',
    apple: '/purple-logo.png',
  },
}

// ====================================================================
// 🏗️ LAYOUT PRINCIPAL
// ====================================================================

/**
 * Layout raiz da aplicação
 *
 * Hierarquia de Providers:
 * 1. QueryClientProviderApp - Cache de dados (React Query)
 * 2. AuthProvider - Estado de autenticação
 * 3. UserProvider - Dados específicos do usuário
 *
 * Funcionalidades:
 * - Providers globais configurados
 * - Sistema de toasts para notificações
 * - Fonts otimizadas carregadas
 * - Firebase inicializado
 * - CSS global aplicado
 *
 * @param children - Páginas da aplicação
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${roboto.variable} bg-white font-roboto antialiased`}>
        {/* 
          🔄 Hierarquia de Providers - ORDEM IMPORTANTE:
          QueryClient > Auth > User > App Content
        */}
        <QueryClientProviderApp>
          <AuthProvider>
            <UserProvider>
              <ErrorBoundary>
                <main id="root">{children}</main>
              </ErrorBoundary>

              {/* 🔔 Container de notificações Toast */}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </UserProvider>
          </AuthProvider>
        </QueryClientProviderApp>
      </body>
    </html>
  )
}

// ====================================================================
// 📚 ESTRUTURA DE PROVIDERS
// ====================================================================

/**
 * Explicação da hierarquia de providers:
 *
 * 🔄 QueryClientProviderApp:
 * - Mais externo: cache de dados para toda aplicação
 * - Persist queries entre recarregamentos
 * - Configurações globais de cache
 *
 * 🔐 AuthProvider:
 * - Gerencia estado de autenticação
 * - Login, logout, verificação de email
 * - Estado global do usuário logado (UID)
 *
 * 👤 UserProvider:
 * - Dados específicos do usuário (nome, email, role)
 * - Depende do AuthProvider para UID
 * - Operações CRUD de dados do usuário
 *
 * 📱 App Content:
 * - Páginas e componentes da aplicação
 * - Acesso a todos os providers via hooks
 * - Templates de proteção de rotas
 */

// ====================================================================
// 🎯 HOOKS DISPONÍVEIS EM TODA APLICAÇÃO
// ====================================================================

/**
 * Hooks disponíveis em qualquer componente:
 *
 * ```typescript
 * // Autenticação
 * const { userUid, loginWithInternalService, loading } = useAuth()
 *
 * // Dados do usuário
 * const { currentUser, updateUser, fetchAllUsers } = useUser()
 *
 * // React Query
 * const { data, isLoading } = useQuery({ ... })
 * const mutation = useMutation({ ... })
 *
 * // Toasts
 * const { success, error, loading } = useAppToast()
 * ```
 */
