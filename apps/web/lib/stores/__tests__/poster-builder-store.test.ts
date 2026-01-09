import { describe, it, expect, beforeEach } from 'vitest';
import { usePosterBuilderStore } from '../poster-builder-store';

describe('PosterBuilderStore', () => {
  beforeEach(() => {
    usePosterBuilderStore.getState().reset();
  });

  describe('loadFromPoster', () => {
    it('loads poster data into form fields', () => {
      const posterData = {
        templateId: 'tpl-001',
        athleteName: 'Marcus Silva',
        tournament: 'Spring Championship',
        beltRank: 'purple' as const,
        team: 'Gracie Academy',
        date: '2026-03-15',
        location: 'Los Angeles, CA',
      };

      usePosterBuilderStore.getState().loadFromPoster(posterData);

      const state = usePosterBuilderStore.getState();
      expect(state.selectedTemplateId).toBe('tpl-001');
      expect(state.athleteName).toBe('Marcus Silva');
      expect(state.tournament).toBe('Spring Championship');
      expect(state.beltRank).toBe('purple');
      expect(state.team).toBe('Gracie Academy');
      expect(state.date).toBe('2026-03-15');
      expect(state.location).toBe('Los Angeles, CA');
    });

    it('handles partial data with defaults', () => {
      const posterData = {
        templateId: 'tpl-002',
        athleteName: 'Jake',
        tournament: 'Open Mat',
        beltRank: 'white' as const,
      };

      usePosterBuilderStore.getState().loadFromPoster(posterData);

      const state = usePosterBuilderStore.getState();
      expect(state.selectedTemplateId).toBe('tpl-002');
      expect(state.athleteName).toBe('Jake');
      expect(state.team).toBe('');
      expect(state.date).toBe('');
      expect(state.location).toBe('');
    });

    it('clears athletePhoto when loading', () => {
      // Set a photo first
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      usePosterBuilderStore.getState().setPhoto(mockFile);

      usePosterBuilderStore.getState().loadFromPoster({
        templateId: 'tpl-001',
        athleteName: 'Test',
        tournament: 'Test',
        beltRank: 'white',
      });

      expect(usePosterBuilderStore.getState().athletePhoto).toBeNull();
    });
  });
});
