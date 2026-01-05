import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useUserStore } from '../user-store';

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useUserStore.setState({
        user: null,
        subscriptionTier: 'free',
        postersThisMonth: 0,
        postersLimit: 3,
      });
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useUserStore.getState();

      expect(state.user).toBeNull();
      expect(state.subscriptionTier).toBe('free');
      expect(state.postersThisMonth).toBe(0);
      expect(state.postersLimit).toBe(3);
    });
  });

  describe('setUser', () => {
    it('sets user object', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      act(() => {
        useUserStore.getState().setUser(mockUser);
      });

      expect(useUserStore.getState().user).toEqual(mockUser);
    });

    it('clears user with null', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      act(() => {
        useUserStore.getState().setUser(mockUser);
        useUserStore.getState().setUser(null);
      });

      expect(useUserStore.getState().user).toBeNull();
    });

    it('updates subscription tier and limits based on user tier', () => {
      const proUser = {
        id: 'user-123',
        email: 'pro@example.com',
        name: 'Pro User',
      };

      act(() => {
        useUserStore.getState().setUser(proUser, 'pro');
      });

      const state = useUserStore.getState();
      expect(state.subscriptionTier).toBe('pro');
      expect(state.postersLimit).toBe(20);
    });

    it('sets unlimited posters for premium tier', () => {
      const premiumUser = {
        id: 'user-456',
        email: 'premium@example.com',
        name: 'Premium User',
      };

      act(() => {
        useUserStore.getState().setUser(premiumUser, 'premium');
      });

      const state = useUserStore.getState();
      expect(state.subscriptionTier).toBe('premium');
      expect(state.postersLimit).toBe(-1);
    });

    it('resets quota when setting new user', () => {
      // Simulate existing user with usage
      act(() => {
        useUserStore.setState({ postersThisMonth: 5 });
      });

      const newUser = {
        id: 'new-user',
        email: 'new@example.com',
        name: 'New User',
      };

      act(() => {
        useUserStore.getState().setUser(newUser);
      });

      expect(useUserStore.getState().postersThisMonth).toBe(0);
    });
  });

  describe('resetUser', () => {
    it('clears user and resets all state to defaults', () => {
      // Setup: user with usage
      act(() => {
        useUserStore.getState().setUser(
          { id: 'user-123', email: 'test@example.com', name: 'Test' },
          'pro'
        );
        useUserStore.setState({ postersThisMonth: 15 });
      });

      // Verify setup
      expect(useUserStore.getState().user).not.toBeNull();
      expect(useUserStore.getState().subscriptionTier).toBe('pro');

      // Reset
      act(() => {
        useUserStore.getState().resetUser();
      });

      // Verify reset
      const state = useUserStore.getState();
      expect(state.user).toBeNull();
      expect(state.subscriptionTier).toBe('free');
      expect(state.postersThisMonth).toBe(0);
      expect(state.postersLimit).toBe(3);
    });
  });

  describe('tier transitions', () => {
    it('transitions from free to pro correctly', () => {
      const user = { id: 'user-1', email: 'user@example.com', name: 'User' };

      // Start as free
      act(() => {
        useUserStore.getState().setUser(user, 'free');
        useUserStore.setState({ postersThisMonth: 2 });
      });

      expect(useUserStore.getState().postersLimit).toBe(3);

      // Upgrade to pro
      act(() => {
        useUserStore.getState().setUser(user, 'pro');
      });

      const state = useUserStore.getState();
      expect(state.subscriptionTier).toBe('pro');
      expect(state.postersLimit).toBe(20);
      expect(state.postersThisMonth).toBe(0); // Reset on tier change
    });

    it('transitions from pro to premium correctly', () => {
      const user = { id: 'user-1', email: 'user@example.com', name: 'User' };

      // Start as pro
      act(() => {
        useUserStore.getState().setUser(user, 'pro');
        useUserStore.setState({ postersThisMonth: 18 });
      });

      // Upgrade to premium
      act(() => {
        useUserStore.getState().setUser(user, 'premium');
      });

      const state = useUserStore.getState();
      expect(state.subscriptionTier).toBe('premium');
      expect(state.postersLimit).toBe(-1);
      expect(state.canCreatePoster()).toBe(true);
    });

    it('downgrades from premium to free correctly', () => {
      const user = { id: 'user-1', email: 'user@example.com', name: 'User' };

      // Start as premium
      act(() => {
        useUserStore.getState().setUser(user, 'premium');
        useUserStore.setState({ postersThisMonth: 50 });
      });

      // Downgrade to free
      act(() => {
        useUserStore.getState().setUser(user, 'free');
      });

      const state = useUserStore.getState();
      expect(state.subscriptionTier).toBe('free');
      expect(state.postersLimit).toBe(3);
      expect(state.postersThisMonth).toBe(0); // Reset on tier change
    });
  });

  describe('canCreatePoster', () => {
    it('returns true when under quota (free tier)', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 2,
          postersLimit: 3,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(true);
    });

    it('returns false when at limit (free tier)', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 3,
          postersLimit: 3,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(false);
    });

    it('returns false when over limit (free tier)', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 5,
          postersLimit: 3,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(false);
    });

    it('returns true for premium tier regardless of usage', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'premium',
          postersThisMonth: 100,
          postersLimit: -1,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(true);
    });

    it('returns true when pro tier is under limit', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'pro',
          postersThisMonth: 19,
          postersLimit: 20,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(true);
    });

    it('returns false when pro tier is at limit', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'pro',
          postersThisMonth: 20,
          postersLimit: 20,
        });
      });

      expect(useUserStore.getState().canCreatePoster()).toBe(false);
    });
  });

  describe('incrementUsage', () => {
    it('increments postersThisMonth by 1', () => {
      act(() => {
        useUserStore.setState({ postersThisMonth: 0 });
        useUserStore.getState().incrementUsage();
      });

      expect(useUserStore.getState().postersThisMonth).toBe(1);
    });

    it('increments from existing count', () => {
      act(() => {
        useUserStore.setState({ postersThisMonth: 5 });
        useUserStore.getState().incrementUsage();
      });

      expect(useUserStore.getState().postersThisMonth).toBe(6);
    });

    it('can increment multiple times', () => {
      act(() => {
        useUserStore.setState({ postersThisMonth: 0 });
        useUserStore.getState().incrementUsage();
        useUserStore.getState().incrementUsage();
        useUserStore.getState().incrementUsage();
      });

      expect(useUserStore.getState().postersThisMonth).toBe(3);
    });
  });
});
