'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckSquare,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Megaphone,
  Mail,
  Video,
  Copy,
  Upload,
  Check,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
}

interface Approval {
  id: string
  type: string
  status: string
  title: string
  description: string
  brandId: string
  brandName: string
  resourceType: string
  resourceId: string
  proposedChanges: any
  requesterName: string
  createdAt: string
  reviewedAt: string | null
  reviewerName: string | null
}

interface Stats {
  pending: number
  approved: number
  rejected: number
}

export default function ApprovalsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [brandsRes, approvalsRes] = await Promise.all([
        fetch('/api/brands', { credentials: 'include' }),
        fetch('/api/approvals?status=ALL', { credentials: 'include' }),
      ])

      if (brandsRes.ok) {
        const data = await brandsRes.json()
        setBrands(data.brands || [])
      }

      if (approvalsRes.ok) {
        const data = await approvalsRes.json()
        const allApprovals = data.data || []
        setApprovals(allApprovals)

        // Calculate stats
        setStats({
          pending: allApprovals.filter((a: Approval) => a.status === 'PENDING').length,
          approved: allApprovals.filter((a: Approval) => a.status === 'APPROVED').length,
          rejected: allApprovals.filter((a: Approval) => a.status === 'REJECTED').length,
        })
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    try {
      setProcessingId(id)
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        // Refresh data
        await fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to process approval')
      }
    } catch (err) {
      console.error('Failed to process approval:', err)
      alert('Failed to process approval')
    } finally {
      setProcessingId(null)
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  async function handleVideoUpload(contentId: string, platform: string, file: File) {
    try {
      setUploadingId(contentId)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('platform', platform)

      const res = await fetch(`/api/content/${contentId}/video`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Video uploaded successfully! URL: ${data.videoUrl}`)
        await fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to upload video')
      }
    } catch (err) {
      console.error('Failed to upload video:', err)
      alert('Failed to upload video')
    } finally {
      setUploadingId(null)
    }
  }

  // Check if content is for a video platform
  const isVideoContent = (approval: Approval) => {
    const videoPlatforms = ['tiktok', 'youtube']
    const platforms = approval.proposedChanges?.platforms || []
    return platforms.some((p: string) => videoPlatforms.includes(p))
  }

  // Get video script from approval
  const getVideoScript = (approval: Approval) => {
    const platformVersions = approval.proposedChanges?.platformVersions || {}
    const videoPlatform = Object.keys(platformVersions).find(p => ['tiktok', 'youtube'].includes(p))
    if (videoPlatform) {
      return platformVersions[videoPlatform]
    }
    return null
  }

  const filteredApprovals = approvals.filter((a) => {
    if (activeTab === 'pending') return a.status === 'PENDING'
    if (activeTab === 'approved') return a.status === 'APPROVED'
    if (activeTab === 'rejected') return a.status === 'REJECTED'
    return true
  })

  const getTypeIcon = (type: string, approval?: Approval) => {
    if (approval && isVideoContent(approval)) {
      return <Video className="h-4 w-4" />
    }
    switch (type) {
      case 'CONTENT_PUBLISH':
        return <FileText className="h-4 w-4" />
      case 'AD_SPEND':
      case 'CAMPAIGN_LAUNCH':
        return <Megaphone className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve AI-generated marketing content
          </p>
        </div>
        <Button onClick={() => fetchData()} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Empty State - No Brands */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <CheckSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start receiving AI-generated content for approval.
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
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.approved}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.rejected}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{approvals.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending
                {stats.pending > 0 && (
                  <span className="ml-1 rounded-full bg-yellow-500/20 text-yellow-600 px-2 py-0.5 text-xs font-medium">
                    {stats.pending}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeTab === 'pending' && 'Pending Approvals'}
                    {activeTab === 'approved' && 'Approved Items'}
                    {activeTab === 'rejected' && 'Rejected Items'}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === 'pending' && 'AI-generated content waiting for your review'}
                    {activeTab === 'approved' && 'Content approved and ready for publishing'}
                    {activeTab === 'rejected' && 'Content that was not approved'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredApprovals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      {activeTab === 'pending' && (
                        <>
                          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No pending approvals</p>
                          <p className="text-sm mt-1">
                            AI-generated content will appear here for review
                          </p>
                        </>
                      )}
                      {activeTab === 'approved' && (
                        <>
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No approved items yet</p>
                        </>
                      )}
                      {activeTab === 'rejected' && (
                        <>
                          <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No rejected items</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredApprovals.map((approval) => {
                        const videoData = getVideoScript(approval)
                        const isVideo = isVideoContent(approval)
                        const isExpanded = expandedId === approval.id

                        return (
                          <div
                            key={approval.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4 flex-1">
                                <div className={`p-2 rounded-lg ${isVideo ? 'bg-purple-500/10' : 'bg-muted'}`}>
                                  {getTypeIcon(approval.type, approval)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{approval.title}</h4>
                                    {isVideo && (
                                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 text-xs font-medium">
                                        Video
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {approval.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span className="px-2 py-0.5 rounded bg-muted">
                                      {approval.brandName}
                                    </span>
                                    <span>by {approval.requesterName}</span>
                                    <span>{formatDate(approval.createdAt)}</span>
                                  </div>

                                  {/* Regular content preview */}
                                  {!isVideo && approval.proposedChanges?.content && (
                                    <div className="mt-3 p-3 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">
                                      {approval.proposedChanges.content.substring(0, 300)}
                                      {approval.proposedChanges.content.length > 300 && '...'}
                                    </div>
                                  )}

                                  {/* Video content - expandable */}
                                  {isVideo && videoData && (
                                    <div className="mt-3 space-y-3">
                                      {/* Caption preview */}
                                      <div className="p-3 bg-muted/50 rounded text-sm">
                                        <p className="font-medium text-xs text-muted-foreground mb-1">Caption:</p>
                                        {videoData.content?.substring(0, 150)}...
                                      </div>

                                      {/* Expand/Collapse for video script */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setExpandedId(isExpanded ? null : approval.id)}
                                        className="w-full"
                                      >
                                        {isExpanded ? 'Hide HeyGen Script' : 'Show HeyGen Script'}
                                      </Button>

                                      {isExpanded && (
                                        <div className="space-y-3 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                                          {/* Hook */}
                                          {videoData.hook && (
                                            <div>
                                              <div className="flex items-center justify-between">
                                                <p className="font-medium text-xs text-purple-600">HOOK (First 3 sec):</p>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => copyToClipboard(videoData.hook, `hook-${approval.id}`)}
                                                  className="h-6 px-2"
                                                >
                                                  {copiedId === `hook-${approval.id}` ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                  ) : (
                                                    <Copy className="h-3 w-3" />
                                                  )}
                                                </Button>
                                              </div>
                                              <p className="text-sm mt-1 italic">"{videoData.hook}"</p>
                                            </div>
                                          )}

                                          {/* Full Script */}
                                          {videoData.videoScript && (
                                            <div>
                                              <div className="flex items-center justify-between">
                                                <p className="font-medium text-xs text-purple-600">
                                                  FULL SCRIPT ({videoData.estimatedDuration || '30-60 sec'}):
                                                </p>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => copyToClipboard(videoData.videoScript, `script-${approval.id}`)}
                                                  className="h-7"
                                                >
                                                  {copiedId === `script-${approval.id}` ? (
                                                    <>
                                                      <Check className="h-3 w-3 mr-1 text-green-500" />
                                                      Copied!
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Copy className="h-3 w-3 mr-1" />
                                                      Copy for HeyGen
                                                    </>
                                                  )}
                                                </Button>
                                              </div>
                                              <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded text-sm whitespace-pre-wrap font-mono">
                                                {videoData.videoScript}
                                              </div>
                                            </div>
                                          )}

                                          {/* Suggestions */}
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            {videoData.suggestedBackground && (
                                              <div className="p-2 bg-muted rounded">
                                                <span className="font-medium">Background:</span> {videoData.suggestedBackground}
                                              </div>
                                            )}
                                            {videoData.suggestedAvatar && (
                                              <div className="p-2 bg-muted rounded">
                                                <span className="font-medium">Avatar:</span> {videoData.suggestedAvatar}
                                              </div>
                                            )}
                                          </div>

                                          {/* Video Upload */}
                                          <div className="pt-3 border-t">
                                            <p className="text-xs text-muted-foreground mb-2">
                                              After creating the video in HeyGen, upload it here:
                                            </p>
                                            <input
                                              type="file"
                                              accept="video/mp4,video/quicktime,video/webm"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                  const platform = approval.proposedChanges?.platforms?.find(
                                                    (p: string) => ['tiktok', 'youtube'].includes(p)
                                                  ) || 'tiktok'
                                                  handleVideoUpload(approval.resourceId, platform, file)
                                                }
                                              }}
                                              className="hidden"
                                              id={`video-upload-${approval.id}`}
                                            />
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => document.getElementById(`video-upload-${approval.id}`)?.click()}
                                              disabled={uploadingId === approval.resourceId}
                                              className="w-full"
                                            >
                                              {uploadingId === approval.resourceId ? (
                                                <>
                                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                  Uploading...
                                                </>
                                              ) : (
                                                <>
                                                  <Upload className="h-4 w-4 mr-2" />
                                                  Upload Video from HeyGen
                                                </>
                                              )}
                                            </Button>
                                            {videoData.videoUrl && (
                                              <p className="text-xs text-green-600 mt-2">
                                                ✓ Video uploaded: {videoData.videoUrl.substring(0, 50)}...
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {approval.status === 'PENDING' ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAction(approval.id, 'reject')}
                                      disabled={processingId === approval.id}
                                    >
                                      {processingId === approval.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <ThumbsDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAction(approval.id, 'approve')}
                                      disabled={processingId === approval.id}
                                    >
                                      {processingId === approval.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <ThumbsUp className="h-4 w-4 mr-1" />
                                          Approve
                                        </>
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      approval.status === 'APPROVED'
                                        ? 'bg-green-500/10 text-green-600'
                                        : 'bg-red-500/10 text-red-600'
                                    }`}
                                  >
                                    {approval.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
