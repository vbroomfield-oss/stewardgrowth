'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PortalHeader } from '@/components/portal/portal-header'

interface User {
  email: string
  firstName: string
  lastName: string
  role: string
}

interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
}

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MANAGER']

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      try {
        const [userRes, brandsRes] = await Promise.all([
          fetch('/api/user', { credentials: 'include' }),
          fetch('/api/portal/brands', { credentials: 'include' }),
        ])

        if (userRes.ok) {
          const userData = await userRes.json()
          if (userData.user) {
            // Redirect admin users back to the main dashboard
            if (ADMIN_ROLES.includes(userData.user.role)) {
              router.replace('/')
              return
            }
            setUser(userData.user)
          }
        } else {
          router.replace('/login')
          return
        }

        if (brandsRes.ok) {
          const brandsData = await brandsRes.json()
          setBrands(brandsData.brands || [])
        }
      } catch (error) {
        console.error('Failed to load portal:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        user={user}
        brands={brands}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
