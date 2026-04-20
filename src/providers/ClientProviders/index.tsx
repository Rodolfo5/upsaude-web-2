"use client"

import React, { ReactNode } from 'react'
import { ToastContainer } from 'react-toastify'

import ErrorBoundary from '@/components/atoms/ErrorBoundary/errorBoundary'
import AuthProvider from '@/providers/Auth'
import QueryClientProviderApp from '@/providers/QueryClientApp'
import UserProvider from '@/providers/User'

interface Props {
  children: ReactNode
}

export default function ClientProviders({ children }: Props) {
  return (
    <QueryClientProviderApp>
      <AuthProvider>
        <UserProvider>
          <ErrorBoundary>{children}</ErrorBoundary>

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
  )
}
