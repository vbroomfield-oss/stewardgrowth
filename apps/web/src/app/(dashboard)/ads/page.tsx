'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target,
  Plus,
  Loader2,
  Megaphone,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
}

interface PlatformConnection {
  id: string
  brandId: string
  brandName: string
  platform: string
  status: string
  accountName: string | null
  lastSyncAt: string | null
}

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', color: 'text-sky-600', enabled: true },
  { id: 'twitter', name: 'Twitter / X', color: 'text-gray-800', enabled: false },
  { id: 'facebook', name: 'Facebook', color: 'text-blue-600', enabled: false },
  { id: 'instagram', name: 'Instagram', color: 'text-pink-600', enabled: false },
]

export default function AdsPage() {
  const searchParams = useSearchParams()
  const [brands, setBrands] = useState<Brand[]>([])
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  // Check for success/error messages
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [brandsRes, platformsRes] = await Promise.all([
        fetch('/api/brands', { credentials: 'include' }),
        fetch('/api/platforms', { credentials: 'include' }),
      ])

      if (brandsRes.ok) {
        const data = await brandsRes.json()
        const brandList = data.brands || []
        setBrands(brandList)
        if (brandList.length > 0 && !selectedBrand) {
          setSelectedBrand(brandList[0].id)
        }
      }

      if (platformsRes.ok) {
        const data = await platformsRes.json()
        setConnections(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  function getConnectionStatus(platform: string) {
    const conn = connections.find(
      (c) => c.platform === platform && c.brandId === selectedBrand
    )
    return conn
  }

  function handleConnect(platform: string) {
    if (!selectedBrand) {
      alert('Please select a brand first')
      return
    }
    setConnecting(platform)
    window.location.href = `/api/oauth/${platform}/authorize?brandId=${selectedBrand}`
  }

  async function handleDisconnect(connectionId: string) {
    if (!confirm('Are you sure you want to disconnect this platform?')) return

    try {
      const res = await fetch(`/api/platforms?id=${connectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        await fetchData()
      } else {
        alert('Failed to disconnect platform')
      }
    } catch (err) {
      console.error('Error disconnecting:', err)
      alert('Failed to disconnect platform')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success === 'linkedin_connected' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          LinkedIn connected successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          Connection failed: {error.replace(/_/g, ' ')}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social & Ad Platforms</h1>
          <p className="text-muted-foreground">
            Connect your social media accounts for automated publishing
          </p>
        </div>
        {brands.length > 0 && (
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start connecting social media platforms for automated marketing.
            </p>
            <Button asChild size="lg">
              <Link href="/brands/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Brand
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Platform Connections */}
          <Card>
            <CardHeader>
              <CardTitle>Connect Platforms</CardTitle>
              <CardDescription>
                Link your social media accounts to enable automated content publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLATFORMS.map((platform) => {
                  const connection = getConnectionStatus(platform.id)
                  const isConnected = connection?.status === 'CONNECTED'

                  return (
                    <div
                      key={platform.id}
                      className={`p-4 border rounded-lg ${
                        isConnected ? 'border-green-200 bg-green-50/50' : 'border-dashed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-medium ${platform.color}`}>
                          {platform.name}
                        </span>
                        {isConnected && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>

                      {isConnected ? (
                        <>
                          <p className="text-sm text-green-700 mb-1">
                            Connected as {connection.accountName || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Last sync: {connection.lastSyncAt
                              ? new Date(connection.lastSyncAt).toLocaleDateString()
                              : 'Never'}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDisconnect(connection.id)}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-3">
                            {platform.enabled ? 'Not connected' : 'Coming soon'}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={!platform.enabled || connecting === platform.id}
                            onClick={() => handleConnect(platform.id)}
                          >
                            {connecting === platform.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                {platform.enabled ? 'Connect' : 'Coming Soon'}
                                {platform.enabled && (
                                  <ExternalLink className="ml-2 h-3 w-3" />
                                )}
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts Summary */}
          {connections.filter((c) => c.status === 'CONNECTED').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>All your connected social media accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connections
                    .filter((c) => c.status === 'CONNECTED')
                    .map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium capitalize">{conn.platform}</p>
                            <p className="text-sm text-muted-foreground">
                              {conn.accountName} - {conn.brandName}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDisconnect(conn.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">How it works</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Connect your social media accounts above</li>
                <li>AI generates content weekly for each connected platform</li>
                <li>Review and approve content in the Approvals page</li>
                <li>Approved content is automatically published at scheduled times</li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
