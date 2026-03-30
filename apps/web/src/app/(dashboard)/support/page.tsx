'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import {
  Loader2,
  Plus,
  Bug,
  Lightbulb,
  Eye,
  Zap,
  Shield,
  HelpCircle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react'

interface Ticket {
  id: string
  createdAt: string
  title: string
  description: string
  category: string
  severity: string
  featureArea: string | null
  stepsToReproduce: string | null
  status: string
  response: string | null
  respondedAt: string | null
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

const CATEGORIES = [
  { value: 'BUG', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'USABILITY', label: 'Usability Issue', icon: Eye, color: 'text-blue-500' },
  { value: 'PERFORMANCE', label: 'Performance', icon: Zap, color: 'text-orange-500' },
  { value: 'SECURITY', label: 'Security', icon: Shield, color: 'text-purple-500' },
  { value: 'QUESTION', label: 'Question', icon: HelpCircle, color: 'text-gray-500' },
  { value: 'DAILY_REPORT', label: 'Daily Report', icon: ClipboardList, color: 'text-green-500' },
]

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-700' },
]

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  OPEN: { label: 'Open', icon: AlertCircle, color: 'text-blue-500' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'text-yellow-500' },
  RESOLVED: { label: 'Resolved', icon: CheckCircle2, color: 'text-green-500' },
  CLOSED: { label: 'Closed', icon: CheckCircle2, color: 'text-gray-500' },
  WONT_FIX: { label: "Won't Fix", icon: XCircle, color: 'text-red-500' },
}

const FEATURE_AREAS = [
  'Dashboard',
  'Brand Management',
  'Content Generation',
  'Social Connections',
  'Video Pipeline',
  'Analytics & Reports',
  'SEO Tools',
  'Approvals',
  'Settings',
  'Customer Portal',
  'Login / Signup',
  'Other',
]

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // New ticket form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('BUG')
  const [severity, setSeverity] = useState('MEDIUM')
  const [featureArea, setFeatureArea] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [filterStatus, filterCategory])

  async function fetchTickets() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterCategory !== 'all') params.set('category', filterCategory)
      const res = await fetch(`/api/support/tickets?${params}`)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch {
      toast({ title: 'Error loading tickets', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          featureArea: featureArea || null,
          stepsToReproduce: stepsToReproduce || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create ticket')
      }

      toast({ title: 'Ticket submitted successfully' })
      setTitle('')
      setDescription('')
      setCategory('BUG')
      setSeverity('MEDIUM')
      setFeatureArea('')
      setStepsToReproduce('')
      setShowNewForm(false)
      fetchTickets()
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const openCount = tickets.filter(t => t.status === 'OPEN').length
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length
  const resolvedCount = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            Report bugs, request features, and submit daily testing reports
          </p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-sm text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{resolvedCount}</div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* New Ticket Form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit a New Ticket</CardTitle>
            <CardDescription>
              Describe the issue or request in detail. Include steps to reproduce for bugs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                          category === cat.value
                            ? 'border-primary bg-primary/5 font-medium'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${cat.color}`} />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Brief summary of the issue"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed description of what happened, what you expected, and what actually occurred..."
                  required
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Severity */}
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SEVERITIES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Feature Area */}
                <div className="space-y-2">
                  <Label>Feature Area</Label>
                  <select
                    value={featureArea}
                    onChange={e => setFeatureArea(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select area...</option>
                    {FEATURE_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Steps to Reproduce (for bugs) */}
              {(category === 'BUG' || category === 'PERFORMANCE') && (
                <div className="space-y-2">
                  <Label htmlFor="steps">Steps to Reproduce</Label>
                  <textarea
                    id="steps"
                    value={stepsToReproduce}
                    onChange={e => setStepsToReproduce(e.target.value)}
                    placeholder={"1. Go to ...\n2. Click on ...\n3. Notice that ..."}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Ticket
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No tickets yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Submit your first ticket to report a bug or request a feature.
            </p>
            <Button className="mt-4" onClick={() => setShowNewForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const catConfig = CATEGORIES.find(c => c.value === ticket.category)
            const sevConfig = SEVERITIES.find(s => s.value === ticket.severity)
            const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN
            const StatusIcon = statusConfig.icon
            const CatIcon = catConfig?.icon || Bug
            const isExpanded = expandedTicket === ticket.id

            return (
              <Card key={ticket.id} className="overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                >
                  <div className="flex items-center gap-4 p-4">
                    <CatIcon className={`h-5 w-5 flex-shrink-0 ${catConfig?.color || 'text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{ticket.title}</span>
                        {ticket.response && (
                          <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{ticket.user.firstName} {ticket.user.lastName}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {ticket.featureArea && <span>{ticket.featureArea}</span>}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sevConfig?.color || ''}`}>
                      {sevConfig?.label}
                    </span>
                    <div className={`flex items-center gap-1 text-sm ${statusConfig.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">{statusConfig.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t pt-4 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="text-sm whitespace-pre-wrap mt-1">{ticket.description}</p>
                    </div>

                    {ticket.stepsToReproduce && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Steps to Reproduce</Label>
                        <p className="text-sm whitespace-pre-wrap mt-1">{ticket.stepsToReproduce}</p>
                      </div>
                    )}

                    {ticket.response && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <Label className="text-xs text-blue-600">Admin Response</Label>
                        <p className="text-sm whitespace-pre-wrap mt-1">{ticket.response}</p>
                        {ticket.respondedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(ticket.respondedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
