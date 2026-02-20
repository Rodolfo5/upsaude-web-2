'use client'

import RouteGuard from '@/router'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard accessType="public">
      <main className="flex w-full flex-col items-center justify-center gap-5">
        {children}
      </main>
    </RouteGuard>
  )
}
