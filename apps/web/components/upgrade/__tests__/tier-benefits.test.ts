import { describe, it, expect } from 'vitest'
import { getTierBenefits, getTierHeadline } from '../tier-benefits'

describe('tier-benefits', () => {
  describe('getTierBenefits', () => {
    it('returns pro benefits', () => {
      const benefits = getTierBenefits('pro')
      expect(benefits).toHaveLength(4)
      expect(benefits[0]).toBe('20 posters/month')
    })

    it('returns premium benefits', () => {
      const benefits = getTierBenefits('premium')
      expect(benefits).toHaveLength(4)
      expect(benefits[0]).toBe('Unlimited posters')
    })
  })

  describe('getTierHeadline', () => {
    it('returns pro headline', () => {
      expect(getTierHeadline('pro')).toBe('Upgrade to Pro')
    })

    it('returns premium headline', () => {
      expect(getTierHeadline('premium')).toBe('Upgrade to Premium')
    })
  })
})
