export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/client'

// Stripe webhook handler
// For local testing: stripe listen --forward-to localhost:3000/api/webhooks/stripe
export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    })

    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    let event: any

    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      // In development without webhook secret, parse directly
      event = JSON.parse(body)
    }

    console.log('[Stripe Webhook] Event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const orgId = session.metadata?.orgId
        const tier = session.metadata?.tier || 'GROWTH'

        if (orgId) {
          // Map tier string to enum value
          const tierMap: Record<string, string> = {
            starter: 'STARTER',
            growth: 'GROWTH',
            enterprise: 'ENTERPRISE',
          }

          await db.organization.update({
            where: { id: orgId },
            data: {
              subscriptionTier: (tierMap[tier] || 'GROWTH') as any,
              stripeCustomerId: session.customer,
              subscriptionEnds: null, // Active subscription
            },
          })
          console.log(`[Stripe] Org ${orgId} upgraded to ${tier}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer

        if (customerId) {
          const org = await db.organization.findFirst({
            where: { stripeCustomerId: customerId },
          })

          if (org && subscription.cancel_at_period_end) {
            await db.organization.update({
              where: { id: org.id },
              data: {
                subscriptionEnds: new Date(subscription.current_period_end * 1000),
              },
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        if (customerId) {
          await db.organization.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionTier: 'FREE',
              subscriptionEnds: null,
            },
          })
          console.log(`[Stripe] Customer ${customerId} downgraded to FREE`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerEmail = invoice.customer_email

        if (customerEmail) {
          await sendEmail({
            to: customerEmail,
            subject: 'Payment Failed - StewardGrowth',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Payment Failed</h2>
                <p>We were unable to process your payment for StewardGrowth.</p>
                <p>Please update your payment method to continue using premium features.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing"
                   style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                  Update Payment Method
                </a>
              </div>
            `,
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
