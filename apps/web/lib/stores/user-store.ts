import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserState {
  user: User | null;
  subscriptionTier: SubscriptionTier;
  postersThisMonth: number;
  postersLimit: number;
}

export interface UserActions {
  setUser: (user: User | null, tier?: SubscriptionTier) => void;
  canCreatePoster: () => boolean;
  incrementUsage: () => void;
}

export type UserStore = UserState & UserActions;

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 3,
  pro: 20,
  premium: -1, // unlimited
};

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      user: null,
      subscriptionTier: 'free',
      postersThisMonth: 0,
      postersLimit: TIER_LIMITS.free,

      setUser: (user, tier = 'free') =>
        set({
          user,
          subscriptionTier: tier,
          postersLimit: TIER_LIMITS[tier],
        }),

      canCreatePoster: () => {
        const { postersLimit, postersThisMonth } = get();
        // -1 means unlimited
        if (postersLimit === -1) return true;
        return postersThisMonth < postersLimit;
      },

      incrementUsage: () =>
        set((state) => ({
          postersThisMonth: state.postersThisMonth + 1,
        })),
    }),
    { name: 'UserStore' }
  )
);
