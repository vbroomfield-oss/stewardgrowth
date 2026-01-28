'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'

interface User {
  email: string
  firstName: string
  lastName: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser({
              email: data.user.email,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }
    fetchUser()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          user={user || { email: '', firstName: '', lastName: '' }}
        />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
