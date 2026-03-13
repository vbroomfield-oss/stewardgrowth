'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, X, Building2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageOption {
  id: string
  name: string
  category?: string
  igUsername?: string
}

interface PageSelectorModalProps {
  platform: 'facebook' | 'instagram' | 'linkedin'
  brandId: string
  onSelect: (selected: { id: string; name: string }) => void
  onClose: () => void
}

export function PageSelectorModal({ platform, brandId, onSelect, onClose }: PageSelectorModalProps) {
  const [options, setOptions] = useState<PageOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOptions()
  }, [platform, brandId])

  const fetchOptions = async () => {
    setLoading(true)
    setError(null)

    try {
      if (platform === 'linkedin') {
        const res = await fetch(`/api/oauth/linkedin/organizations?brandId=${brandId}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setOptions(
          (data.organizations || []).map((org: any) => ({
            id: org.id,
            name: org.name,
            category: org.vanityName ? `linkedin.com/company/${org.vanityName}` : undefined,
          }))
        )
      } else {
        const res = await fetch(`/api/oauth/meta/pages?brandId=${brandId}&platform=${platform}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error)

        if (platform === 'instagram') {
          setOptions(
            (data.accounts || []).map((acc: any) => ({
              id: acc.pageId,
              name: acc.igUsername,
              category: acc.pageName,
              igUsername: acc.igUsername,
            }))
          )
        } else {
          setOptions(
            (data.pages || []).map((page: any) => ({
              id: page.id,
              name: page.name,
              category: page.category,
            }))
          )
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load options')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedId) return
    const selected = options.find((o) => o.id === selectedId)
    if (!selected) return

    setSaving(true)

    try {
      if (platform === 'linkedin') {
        const res = await fetch('/api/oauth/linkedin/select-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            organizationId: selected.id,
            organizationName: selected.name,
          }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
      } else {
        const res = await fetch('/api/oauth/meta/select-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            platform,
            pageId: selected.id,
          }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
      }

      onSelect({ id: selected.id, name: selected.name })
    } catch (err: any) {
      setError(err.message || 'Failed to save selection')
    } finally {
      setSaving(false)
    }
  }

  const title =
    platform === 'linkedin'
      ? 'Select Company Page'
      : platform === 'instagram'
        ? 'Select Instagram Business Account'
        : 'Select Facebook Page'

  const description =
    platform === 'linkedin'
      ? 'Choose which LinkedIn Company Page to post as for this brand.'
      : platform === 'instagram'
        ? 'Choose which Instagram Business Account to publish to for this brand.'
        : 'Choose which Facebook Page to publish to for this brand.'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchOptions}>
                Retry
              </Button>
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {platform === 'linkedin'
                  ? 'No company pages found. Make sure you are an admin of a LinkedIn Company Page.'
                  : platform === 'instagram'
                    ? 'No Instagram Business Accounts found. Link an Instagram Business Account to one of your Facebook Pages first.'
                    : 'No Facebook Pages found. Create a Facebook Page first, or request page-level permissions.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedId(option.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                    selectedId === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{option.name}</p>
                    {option.category && (
                      <p className="text-xs text-muted-foreground truncate">{option.category}</p>
                    )}
                  </div>
                  {selectedId === option.id && (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {options.length > 0 && (
          <div className="flex items-center justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedId || saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm Selection'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
