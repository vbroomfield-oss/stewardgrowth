import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Check if data already exists
  const existingOrg = await prisma.organization.findFirst()
  if (existingOrg) {
    console.log('Database already has data, skipping seed.')
    return
  }

  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Company',
      slug: 'demo-company',
      primaryColor: '#6366f1',
      timezone: 'America/New_York',
      subscriptionTier: 'FREE',
    },
  })
  console.log(`  Created organization: ${org.name}`)

  // Create demo brand
  const brand = await prisma.saaSBrand.create({
    data: {
      organizationId: org.id,
      name: 'Demo Brand',
      slug: 'demo-brand',
      domain: 'https://demo.example.com',
      brandVoice: JSON.stringify({
        tone: 'Professional yet approachable',
        personality: 'Innovative, trustworthy, helpful',
        keywords: ['growth', 'marketing', 'automation', 'AI'],
        avoidWords: ['cheap', 'basic'],
      }),
      targetAudiences: JSON.stringify([
        {
          name: 'SaaS Founders',
          demographics: 'Age 25-45, tech-savvy',
          painPoints: ['Limited marketing budget', 'No dedicated marketing team'],
          interests: ['Growth hacking', 'Product-led growth'],
        },
      ]),
      goals: JSON.stringify({
        monthly: { leads: 100, trials: 20, revenue: 10000 },
      }),
      isActive: true,
    },
  })
  console.log(`  Created brand: ${brand.name}`)

  console.log('✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
