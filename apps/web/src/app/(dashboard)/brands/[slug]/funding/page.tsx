import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FundingDashboard } from '@/components/brands/funding-dashboard'
import { ArrowLeft, Settings } from 'lucide-react'

// Mock data
const mockBrand = {
  id: '1',
  name: 'StewardMAX',
  slug: 'stewardmax',
}

const mockFunding = {
  balance: 8500,
  monthlyBudget: 10000,
  spent: 6234,
  reserved: 1200, // Pending ad spend
  autoFundEnabled: true,
  autoFundAmount: 5000,
  autoFundThreshold: 2000,
  lastFundedAt: '2024-01-15T10:00:00Z',
  nextFundingDue: '2024-02-01T00:00:00Z',
  status: 'funded' as const,
}

const mockTransactions = [
  {
    id: '1',
    type: 'spend' as const,
    amount: 156.78,
    description: 'Google Ads - Church Software Campaign',
    platform: 'Google Ads',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'spend' as const,
    amount: 89.50,
    description: 'Meta Ads - Lead Gen Campaign',
    platform: 'Meta Ads',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    type: 'reserved' as const,
    amount: 500,
    description: 'Reserved for pending campaign approval',
    timestamp: '1 day ago',
  },
  {
    id: '4',
    type: 'deposit' as const,
    amount: 5000,
    description: 'Auto-fund deposit',
    timestamp: '3 days ago',
  },
  {
    id: '5',
    type: 'spend' as const,
    amount: 234.12,
    description: 'LinkedIn Ads - Ministry Leaders',
    platform: 'LinkedIn Ads',
    timestamp: '4 days ago',
  },
  {
    id: '6',
    type: 'refund' as const,
    amount: 45.00,
    description: 'Refund - Invalid clicks detected',
    platform: 'Google Ads',
    timestamp: '5 days ago',
  },
]

export default function BrandFundingPage({ params }: { params: { slug: string } }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/brands/${params.slug}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketing Funds</h1>
            <p className="text-muted-foreground">
              Manage marketing budget for {mockBrand.name}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/brands/${params.slug}/funding/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Budget Settings
          </Link>
        </Button>
      </div>

      <FundingDashboard
        brand={mockBrand}
        funding={mockFunding}
        recentTransactions={mockTransactions}
      />
    </div>
  )
}
