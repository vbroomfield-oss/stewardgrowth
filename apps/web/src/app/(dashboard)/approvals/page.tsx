'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApprovalItem } from '@/components/dashboard/approval-item'
import {
  CheckSquare,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

// Mock data - will be replaced with real API
const mockPendingApprovals = [
  {
    id: '1',
    type: 'content' as const,
    title: 'LinkedIn post: "5 Ways AI Transforms Church Management"',
    description: 'AI-generated content for weekly social campaign. Discusses automation benefits for churches.',
    brand: 'StewardMAX',
    createdAt: '2 hours ago',
    requestedBy: 'AI Content Engine',
  },
  {
    id: '2',
    type: 'content' as const,
    title: 'Twitter thread: "Why Churches Need VoIP in 2024"',
    description: '5-tweet thread highlighting cost savings and features of VoIP for religious organizations.',
    brand: 'StewardRing',
    createdAt: '3 hours ago',
    requestedBy: 'AI Content Engine',
  },
  {
    id: '3',
    type: 'budget' as const,
    title: 'Increase Meta Ads daily budget',
    description: 'Campaign "Church Software Demo" has 3.2x ROAS. Proposal to increase from $50 to $75/day.',
    brand: 'StewardMAX',
    amount: 750,
    createdAt: '5 hours ago',
    requestedBy: 'AI Decision Engine',
  },
  {
    id: '4',
    type: 'campaign' as const,
    title: 'Launch "VoIP for Churches" Google Ads campaign',
    description: 'New search campaign targeting "church phone system", "church VoIP", and related keywords.',
    brand: 'StewardRing',
    amount: 1500,
    createdAt: '1 day ago',
    requestedBy: 'Marketing Team',
  },
  {
    id: '5',
    type: 'content' as const,
    title: 'Blog post: "Complete Guide to Church Management Software"',
    description: '2,500 word SEO article targeting "church management software" keyword. Includes product comparison.',
    brand: 'StewardMAX',
    createdAt: '1 day ago',
    requestedBy: 'AI SEO Engine',
  },
  {
    id: '6',
    type: 'budget' as const,
    title: 'Pause underperforming LinkedIn campaign',
    description: 'Campaign "Ministry Leaders" has 0.4x ROAS after 14 days. Recommend pausing to reallocate budget.',
    brand: 'StewardPro',
    amount: -500,
    createdAt: '2 days ago',
    requestedBy: 'AI Decision Engine',
  },
]

const mockApprovedItems = [
  {
    id: '7',
    type: 'content' as const,
    title: 'Instagram carousel: "10 Features Every Church Needs"',
    description: 'Educational carousel post highlighting key software features.',
    brand: 'StewardMAX',
    createdAt: '3 days ago',
    approvedAt: '2 days ago',
    approvedBy: 'John Doe',
  },
  {
    id: '8',
    type: 'campaign' as const,
    title: 'Facebook Lead Gen Campaign Q1',
    description: 'Lead generation campaign for free trial signups.',
    brand: 'StewardMAX',
    amount: 2000,
    createdAt: '1 week ago',
    approvedAt: '5 days ago',
    approvedBy: 'Jane Smith',
  },
]

const mockRejectedItems = [
  {
    id: '9',
    type: 'content' as const,
    title: 'Twitter post with competitor comparison',
    description: 'Post directly comparing features with Planning Center. Rejected due to brand guidelines.',
    brand: 'StewardMAX',
    createdAt: '1 week ago',
    rejectedAt: '6 days ago',
    rejectedBy: 'John Doe',
    reason: 'Violates brand guideline: no direct competitor comparisons in social media.',
  },
]

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve marketing content, campaigns, and budget changes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockPendingApprovals.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockApprovedItems.length}</p>
                <p className="text-sm text-muted-foreground">Approved (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockRejectedItems.length}</p>
                <p className="text-sm text-muted-foreground">Rejected (7d)</p>
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
                <p className="text-2xl font-bold">2.5h</p>
                <p className="text-sm text-muted-foreground">Avg. Review Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search approvals..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            <span className="ml-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
              {mockPendingApprovals.length}
            </span>
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

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Items waiting for your review. All content must be approved before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPendingApprovals.map((approval) => (
                <ApprovalItem
                  key={approval.id}
                  {...approval}
                  onApprove={() => console.log('Approve:', approval.title)}
                  onReject={() => console.log('Reject:', approval.title)}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Items</CardTitle>
              <CardDescription>
                Recently approved content and campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockApprovedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-success/5">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{item.brand}</span>
                    </div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Approved by {item.approvedBy} • {item.approvedAt}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Items</CardTitle>
              <CardDescription>
                Items that were not approved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockRejectedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-destructive/5">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{item.brand}</span>
                    </div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-destructive mt-1">
                      Reason: {item.reason}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rejected by {item.rejectedBy} • {item.rejectedAt}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
