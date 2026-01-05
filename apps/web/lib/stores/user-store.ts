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
  resetUser: () => void;
  canCreatePoster: () => boolean;
  incrementUsage: () => void;
}

export type UserStore = UserState & UserActions;

/** Represents unlimited quota (-1 used for comparison) */
export const UNLIMITED = -1;

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 3,
  pro: 20,
  premium: UNLIMITED,
};

const initialState: UserState = {
  user: null,
  subscriptionTier: 'free',
  postersThisMonth: 0,
  postersLimit: TIER_LIMITS.free,
};

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setUser: (user, tier = 'free') =>
        set({
          user,
          subscriptionTier: tier,
          postersLimit: TIER_LIMITS[tier],
          postersThisMonth: 0, // Reset quota on user change
        }),

      resetUser: () => set(initialState),

      canCreatePoster: () => {
        const { postersLimit, postersThisMonth } = get();
        if (postersLimit === UNLIMITED) return true;
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
