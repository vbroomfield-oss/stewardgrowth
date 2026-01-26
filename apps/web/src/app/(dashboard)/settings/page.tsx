'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  Building2,
  Link2,
  CreditCard,
  Users,
  Bell,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const mockOrganization = {
  name: 'Steward Technologies',
  email: 'admin@steward.tech',
  plan: 'internal',
  founderCode: 'STEWARD-FOUNDER-2024',
}

const mockIntegrations = [
  { id: 'google', name: 'Google Ads', connected: true, account: 'steward-ads@gmail.com' },
  { id: 'meta', name: 'Meta Ads', connected: true, account: 'Steward Technologies' },
  { id: 'linkedin', name: 'LinkedIn Ads', connected: true, account: 'Steward Technologies' },
  { id: 'tiktok', name: 'TikTok Ads', connected: false, account: null },
  { id: 'analytics', name: 'Google Analytics', connected: true, account: 'UA-123456789' },
  { id: 'stripe', name: 'Stripe', connected: true, account: 'acct_steward' },
]

const mockTeam = [
  { id: '1', name: 'Vincent Broomfield', email: 'vincent@steward.tech', role: 'owner', status: 'active' },
  { id: '2', name: 'Marketing Bot', email: 'ai@steward.tech', role: 'admin', status: 'active' },
]

const mockApiKeys = [
  { id: '1', name: 'Production API Key', prefix: 'sg_live_', created: '2024-01-01', lastUsed: '2 hours ago' },
  { id: '2', name: 'Development API Key', prefix: 'sg_test_', created: '2024-01-15', lastUsed: '1 day ago' },
]

export default function SettingsPage() {
  const [founderCodeInput, setFounderCodeInput] = useState('')
  const [codeValidated, setCodeValidated] = useState<boolean | null>(null)

  const handleValidateCode = () => {
    // Simple validation - in production would call API
    if (founderCodeInput.toUpperCase() === 'STEWARD-FOUNDER-2024') {
      setCodeValidated(true)
    } else {
      setCodeValidated(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, integrations, and preferences
        </p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Manage your organization information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Organization Name</label>
                <Input defaultValue={mockOrganization.name} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Admin Email</label>
                <Input defaultValue={mockOrganization.email} type="email" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-500" />
                Founder Code
              </CardTitle>
              <CardDescription>
                Internal Steward products use founder codes for fee-free access.
                Marketing funds are still required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockOrganization.founderCode ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      Founder Code Active
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Code: {mockOrganization.founderCode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    All platform fees and ad spend margins are waived. You still need to deposit marketing funds.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter founder code"
                      value={founderCodeInput}
                      onChange={(e) => setFounderCodeInput(e.target.value)}
                    />
                    <Button onClick={handleValidateCode}>Validate</Button>
                  </div>
                  {codeValidated === true && (
                    <p className="text-sm text-green-600">Code validated successfully!</p>
                  )}
                  {codeValidated === false && (
                    <p className="text-sm text-red-600">Invalid code. Please try again.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>
                Manage your ad platform and analytics connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        integration.connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
                      )}>
                        <Link2 className={cn(
                          'h-5 w-5',
                          integration.connected ? 'text-green-600' : 'text-gray-400'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        {integration.connected ? (
                          <p className="text-sm text-muted-foreground">{integration.account}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.connected ? (
                        <>
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </span>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </>
                      ) : (
                        <Button size="sm">
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTeam.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full capitalize',
                        member.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {member.role}
                      </span>
                      {member.role !== 'owner' && (
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Invite Team Member
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400">
                      Internal (Founder)
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      All features included • No platform fees
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                    $0
                    <span className="text-sm font-normal">/mo</span>
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                As an internal Steward product, all platform fees are waived.
                You only pay for actual ad spend through your marketing fund deposits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketing Fund</CardTitle>
              <CardDescription>
                Your pre-funded marketing budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">$7,300</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-2xl font-bold">$1,200</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">This Month Spend</p>
                  <p className="text-2xl font-bold">$6,234</p>
                </div>
              </div>
              <Button className="mt-4">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Funds
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for event tracking and integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockApiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {key.prefix}••••••••••••
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {key.created} • Last used {key.lastUsed}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Tracking SDK</CardTitle>
              <CardDescription>
                Install the tracking snippet on your SaaS products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'sg.start':
  new Date().getTime(),event:'sg.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://growth.steward.tech/sg.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','sgLayer','SG-XXXXXX');
</script>`}
                </pre>
              </div>
              <Button variant="outline" className="mt-4">
                <Copy className="mr-2 h-4 w-4" />
                Copy Snippet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
