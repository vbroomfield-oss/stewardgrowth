import { Logo } from '@/components/logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-purple-500/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size="lg" />

          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">
              AI-Powered Marketing
              <br />
              <span className="text-primary">Growth Platform</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Centralized marketing intelligence for all your SaaS products.
              SEO, content, ads, and analytics in one powerful dashboard.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="bg-card/50 backdrop-blur p-4 rounded-lg border">
                <div className="text-3xl font-bold text-primary">10x</div>
                <div className="text-sm text-muted-foreground">Faster content creation</div>
              </div>
              <div className="bg-card/50 backdrop-blur p-4 rounded-lg border">
                <div className="text-3xl font-bold text-primary">40%</div>
                <div className="text-sm text-muted-foreground">Lower CAC</div>
              </div>
              <div className="bg-card/50 backdrop-blur p-4 rounded-lg border">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">AI monitoring</div>
              </div>
              <div className="bg-card/50 backdrop-blur p-4 rounded-lg border">
                <div className="text-3xl font-bold text-primary">All</div>
                <div className="text-sm text-muted-foreground">Platforms unified</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Part of the Steward ecosystem
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="lg" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
