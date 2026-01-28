'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Search,
  FileText,
  Megaphone,
  Phone,
  Sparkles,
  CheckSquare,
  Settings,
  HelpCircle,
  ChevronDown,
  Target,
  Calendar,
  Zap,
  Globe,
  LineChart,
  BookOpen,
  Plus,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navigation = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'All Brands', href: '/brands', icon: Building2 },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Events', href: '/analytics/events', icon: Zap },
      { name: 'KPIs', href: '/analytics/kpis', icon: LineChart },
      { name: 'Attribution', href: '/analytics/attribution', icon: Target },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { name: 'SEO', href: '/seo', icon: Search },
      { name: 'Content', href: '/content', icon: FileText },
      { name: 'Ads', href: '/ads', icon: Megaphone },
      { name: 'Books', href: '/books', icon: BookOpen },
    ],
  },
  {
    label: 'AI & Insights',
    items: [
      { name: 'Recommendations', href: '/ai', icon: Sparkles },
      { name: 'Weekly Plans', href: '/ai/plans', icon: Calendar },
      { name: 'Calls', href: '/calls', icon: Phone },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Approvals', href: '/approvals', icon: CheckSquare },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
]

interface Brand {
  id: string
  name: string
  slug: string
  color?: string
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setBrands(data.brands || [])
        }
      } catch (err) {
        console.error('Failed to load brands for sidebar:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [])

  return (
    <div className={cn('flex flex-col h-full bg-card border-r', className)}>
      {/* Logo */}
      <div className="px-3 py-2 border-b">
        <Link href="/" className="flex items-center justify-center bg-gray-400 dark:bg-gray-500 rounded-lg hover:bg-gray-500 dark:hover:bg-gray-400 transition-colors overflow-hidden shadow-lg">
          <Logo size="sm" />
        </Link>
      </div>

      {/* Brand Selector */}
      <div className="p-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <span className="truncate">
                  {selectedBrand
                    ? brands.find(b => b.id === selectedBrand)?.name || 'All Brands'
                    : 'All Brands'
                  }
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setSelectedBrand(null)}>
              <Globe className="mr-2 h-4 w-4" />
              All Brands
            </DropdownMenuItem>
            {brands.length > 0 && <Separator className="my-1" />}
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : brands.length > 0 ? (
              brands.map((brand) => (
                <DropdownMenuItem
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.id)}
                  asChild
                >
                  <Link href={`/brands/${brand.slug}`}>
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: brand.color || '#6366f1' }}
                    />
                    {brand.name}
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/brands/new" className="text-muted-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first brand
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigation.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            pathname === '/settings'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          Help & Support
        </Link>
      </div>
    </div>
  )
}
