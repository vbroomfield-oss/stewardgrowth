import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon' | 'white'
}

export function Logo({ className, showText = true, size = 'md', variant = 'full' }: LogoProps) {
  const sizes = {
    sm: { width: 200, height: 52, iconSize: 40 },
    md: { width: 280, height: 72, iconSize: 56 },
    lg: { width: 360, height: 92, iconSize: 72 },
  }

  // Use icon-only for small spaces or when showText is false
  if (!showText || variant === 'icon') {
    return (
      <div className={cn('flex items-center', className)}>
        <Image
          src="/images/StewardGrowth_Icon.png"
          alt="StewardGrowth"
          width={sizes[size].iconSize}
          height={sizes[size].iconSize}
          className="object-contain"
          priority
        />
      </div>
    )
  }

  // Full logo with text
  const logoSrc = variant === 'white'
    ? '/images/StewardGrowth_White.png'
    : '/images/StewardGrowth_FullColor.png'

  return (
    <div className={cn('flex items-center overflow-hidden', className)}>
      <Image
        src={logoSrc}
        alt="StewardGrowth"
        width={sizes[size].width}
        height={sizes[size].height}
        className="object-cover scale-150"
        priority
      />
    </div>
  )
}
