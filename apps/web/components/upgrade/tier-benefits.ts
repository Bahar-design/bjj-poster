export type TargetTier = 'pro' | 'premium'

const TIER_BENEFITS: Record<TargetTier, string[]> = {
  pro: ['20 posters/month', 'HD exports', 'No watermark', 'Priority templates'],
  premium: [
    'Unlimited posters',
    '4K exports',
    'Priority support',
    'Custom branding',
  ],
}

const TIER_HEADLINES: Record<TargetTier, string> = {
  pro: 'Upgrade to Pro',
  premium: 'Upgrade to Premium',
}

export function getTierBenefits(tier: TargetTier): string[] {
  return TIER_BENEFITS[tier]
}

export function getTierHeadline(tier: TargetTier): string {
  return TIER_HEADLINES[tier]
}
