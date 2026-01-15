// apps/web/lib/analytics.ts
export type AnalyticsEvent =
  | 'upgrade_prompt_viewed'
  | 'upgrade_prompt_clicked'
  | 'upgrade_prompt_dismissed'
  | 'quota_limit_modal_viewed'
  | 'quota_limit_upgrade_clicked'
  | 'quota_limit_maybe_later_clicked'
  | 'first_poster_celebration_viewed'
  | 'first_poster_downloaded'
  | 'first_poster_shared'
  | 'first_poster_celebration_dismissed'
  // New events for premium upsell flow
  | 'quota_badge_upgrade_clicked'
  | 'feature_teaser_viewed'
  | 'feature_teaser_clicked'
  | 'feature_teaser_dismissed'
  | 'template_tier_upgrade_clicked'
  | 'output_preview_compare_clicked'
  | 'contextual_banner_viewed'
  | 'contextual_banner_clicked'
  | 'contextual_banner_dismissed'

export interface UpgradePromptProperties {
  source: string
  targetTier: 'pro' | 'premium'
  variant: 'banner' | 'card' | 'modal'
}

export interface QuotaLimitProperties {
  postersCount?: number
  tier?: string
  source?: string
  nextResetDate?: string
}

export interface FirstPosterCelebrationProperties {
  tier?: string
  platform?: 'facebook' | 'native_share' | 'copy_link'
  source?: string
}

export interface QuotaBadgeProperties {
  usage_percentage: number
  posters_remaining: number
}

export interface FeatureTeaserProperties {
  source: string
}

export interface TemplateTierProperties {
  template_id: string
  template_tier: 'pro' | 'premium'
}

export interface OutputPreviewProperties {
  current_tier: string
}

export interface ContextualBannerProperties {
  banner_id: string
  trigger: string
}

export type EventProperties =
  | UpgradePromptProperties
  | QuotaLimitProperties
  | FirstPosterCelebrationProperties
  | QuotaBadgeProperties
  | FeatureTeaserProperties
  | TemplateTierProperties
  | OutputPreviewProperties
  | ContextualBannerProperties

export function track(event: AnalyticsEvent, properties: EventProperties): void {
  // Development: log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics]', event, properties)
  }

  // Production: no-op until real provider configured
  // TODO: Wire to Segment/Posthog/etc
}
