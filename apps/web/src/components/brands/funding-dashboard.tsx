'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  History,
  DollarSign,
  PauseCircle,
  PlayCircle,
} from 'lucide-react'

interface FundingDashboardProps {
  brand: {
    id: string
    name: string
    slug: string
  }
  funding: {
    balance: number
    monthlyBudget: number
    spent: number
    reserved: number
    autoFundEnabled: boolean
    autoFundAmount: number
    autoFundThreshold: number
    lastFundedAt?: string
    nextFundingDue?: string
    status: 'funded' | 'low' | 'depleted' | 'paused'
  }
  recentTransactions: Array<{
    id: string
    type: 'deposit' | 'spend' | 'refund' | 'reserved'
    amount: number
    description: string
    platform?: string
    timestamp: string
  }>
}

export function FundingDashboard({ brand, funding, recentTransactions }: FundingDashboardProps) {
  const [depositAmount, setDepositAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)

  const availableBalance = funding.balance - funding.reserved
  const percentSpent = funding.monthlyBudget > 0
    ? (funding.spent / funding.monthlyBudget) * 100
    : 0
  const daysRemaining = 30 - new Date().getDate() // Simplified

  const statusConfig = {
    funded: {
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      label: 'Fully Funded',
      description: 'Marketing is active',
    },
    low: {
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      label: 'Low Balance',
      description: 'Add funds to continue marketing',
    },
    depleted: {
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      label: 'Depleted',
      description: 'Marketing paused - no funds',
    },
    paused: {
      icon: PauseCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      label: 'Paused',
      description: 'Marketing manually paused',
    },
  }

  const status = statusConfig[funding.status]
  const StatusIcon = status.icon

  async function handleDeposit() {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return

    setIsDepositing(true)
    // In production: Call Stripe to create checkout session
    console.log('Depositing:', amount)
    setTimeout(() => {
      setIsDepositing(false)
      setDepositAmount('')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {funding.status !== 'funded' && (
        <div className={cn(
          'flex items-center gap-3 p-4 rounded-lg border',
          funding.status === 'depleted' && 'bg-destructive/10 border-destructive/20',
          funding.status === 'low' && 'bg-warning/10 border-warning/20',
          funding.status === 'paused' && 'bg-muted border-border'
        )}>
          <StatusIcon className={cn('h-6 w-6', status.color)} />
          <div className="flex-1">
            <p className={cn('font-semibold', status.color)}>{status.label}</p>
            <p className="text-sm text-muted-foreground">{status.description}</p>
          </div>
          {funding.status !== 'paused' && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Funds Now
            </Button>
          )}
        </div>
      )}

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', status.bgColor)}>
                <Wallet className={cn('h-5 w-5', status.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(availableBalance)}</p>
                <p className="text-sm text-muted-foreground">Available Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(funding.monthlyBudget)}</p>
                <p className="text-sm text-muted-foreground">Monthly Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <TrendingDown className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(funding.spent)}</p>
                <p className="text-sm text-muted-foreground">Spent This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(funding.reserved)}</p>
                <p className="text-sm text-muted-foreground">Reserved (Pending)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Budget Progress</CardTitle>
            <CardDescription>
              {daysRemaining} days remaining in billing period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Spent: {formatCurrency(funding.spent)}</span>
                <span>Budget: {formatCurrency(funding.monthlyBudget)}</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    percentSpent > 90 ? 'bg-destructive' :
                    percentSpent > 75 ? 'bg-warning' : 'bg-primary'
                  )}
                  style={{ width: `${Math.min(percentSpent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {percentSpent.toFixed(1)}% of budget used
              </p>
            </div>

            {/* Budget Breakdown */}
            <div className="grid grid-cols-4 gap-4 pt-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{formatCurrency(funding.spent * 0.45)}</p>
                <p className="text-xs text-muted-foreground">Google Ads</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{formatCurrency(funding.spent * 0.30)}</p>
                <p className="text-xs text-muted-foreground">Meta Ads</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{formatCurrency(funding.spent * 0.15)}</p>
                <p className="text-xs text-muted-foreground">LinkedIn</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{formatCurrency(funding.spent * 0.10)}</p>
                <p className="text-xs text-muted-foreground">TikTok</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Deposit */}
        <Card>
          <CardHeader>
            <CardTitle>Add Funds</CardTitle>
            <CardDescription>
              Deposit marketing budget for {brand.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick amounts */}
            <div className="grid grid-cols-2 gap-2">
              {[1000, 2500, 5000, 10000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositAmount(amount.toString())}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or enter amount
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit">Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="deposit"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleDeposit}
              disabled={!depositAmount || isDepositing}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isDepositing ? 'Processing...' : 'Deposit Funds'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Secure payment via Stripe. Funds available immediately.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Fund Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Auto-Fund Settings</CardTitle>
              <CardDescription>
                Automatically maintain your marketing balance
              </CardDescription>
            </div>
            <Button variant={funding.autoFundEnabled ? 'default' : 'outline'}>
              {funding.autoFundEnabled ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Enabled
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Enable Auto-Fund
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {funding.autoFundEnabled && (
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Auto-fund when balance falls below</p>
                <p className="text-xl font-bold">{formatCurrency(funding.autoFundThreshold)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Auto-fund amount</p>
                <p className="text-xl font-bold">{formatCurrency(funding.autoFundAmount)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Payment method</p>
                <p className="text-xl font-bold">•••• 4242</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Funding and spend activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <History className="mr-2 h-4 w-4" />
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    tx.type === 'deposit' && 'bg-success/10',
                    tx.type === 'spend' && 'bg-info/10',
                    tx.type === 'refund' && 'bg-warning/10',
                    tx.type === 'reserved' && 'bg-muted'
                  )}>
                    {tx.type === 'deposit' && <TrendingUp className="h-4 w-4 text-success" />}
                    {tx.type === 'spend' && <TrendingDown className="h-4 w-4 text-info" />}
                    {tx.type === 'refund' && <TrendingUp className="h-4 w-4 text-warning" />}
                    {tx.type === 'reserved' && <Clock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.platform && `${tx.platform} • `}{tx.timestamp}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  'font-semibold',
                  tx.type === 'deposit' && 'text-success',
                  tx.type === 'spend' && 'text-foreground',
                  tx.type === 'refund' && 'text-warning',
                  tx.type === 'reserved' && 'text-muted-foreground'
                )}>
                  {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
