import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import { composePoster } from '../compose-poster.js';
import { initBundledFonts } from '../fonts.js';
import { TemplateNotFoundError } from '../../templates/errors.js';
import { InvalidInputError } from '../errors.js';

describe('composePoster', () => {
  // Create a valid test image
  let validPhoto: Buffer;

  beforeAll(async () => {
    await initBundledFonts();
    // Create a simple 100x100 red image for testing
    validPhoto = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  });

  describe('validation', () => {
    it('throws TemplateNotFoundError for invalid template ID', async () => {
      await expect(
        composePoster({
          templateId: 'nonexistent-template',
          athletePhoto: validPhoto,
          data: {},
        })
      ).rejects.toThrow(TemplateNotFoundError);
    });

    it('throws InvalidInputError when required data fields are missing', async () => {
      await expect(
        composePoster({
          templateId: 'classic',
          athletePhoto: validPhoto,
          data: { athleteName: 'Test' }, // Missing other required fields
        })
      ).rejects.toThrow(InvalidInputError);
    });

    it('throws InvalidInputError with list of missing fields', async () => {
      try {
        await composePoster({
          templateId: 'classic',
          athletePhoto: validPhoto,
          data: { athleteName: 'Test' },
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect((error as Error).message).toContain('Missing required data fields');
        expect((error as Error).message).toContain('achievement');
        expect((error as Error).message).toContain('tournamentName');
        expect((error as Error).message).toContain('date');
      }
    });

    it('throws InvalidInputError for invalid photo buffer', async () => {
      await expect(
        composePoster({
          templateId: 'classic',
          athletePhoto: Buffer.from('not an image'),
          data: {
            athleteName: 'Test',
            achievement: 'Gold',
            tournamentName: 'Worlds',
            date: '2025',
          },
        })
      ).rejects.toThrow(InvalidInputError);
    });
  });

  describe('successful composition', () => {
    const validData = {
      athleteName: 'João Silva',
      achievement: 'Gold Medal',
      tournamentName: 'World Championship 2025',
      date: 'June 2025',
    };

    it('composes poster with valid inputs and returns PNG by default', async () => {
      const result = await composePoster({
        templateId: 'classic',
        athletePhoto: validPhoto,
        data: validData,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.metadata.format).toBe('png');
      expect(result.metadata.width).toBe(1080);
      expect(result.metadata.height).toBe(1350);
      expect(result.metadata.size).toBe(result.buffer.length);
    });

    it('composes poster with JPEG output', async () => {
      const result = await composePoster({
        templateId: 'classic',
        athletePhoto: validPhoto,
        data: validData,
        output: { format: 'jpeg', quality: 90 },
      });

      expect(result.metadata.format).toBe('jpeg');
    });

    it('composes poster with resize option', async () => {
      const result = await composePoster({
        templateId: 'classic',
        athletePhoto: validPhoto,
        data: validData,
        output: { resize: { width: 540 } },
      });

      expect(result.metadata.width).toBe(540);
      // Height should be proportionally scaled
      expect(result.metadata.height).toBe(675);
    });

    it('calls progress callback for each stage including 100% completion', async () => {
      const stages: Array<{ stage: string; percent: number }> = [];

      await composePoster({
        templateId: 'classic',
        athletePhoto: validPhoto,
        data: validData,
        onProgress: (stage, percent) => {
          stages.push({ stage, percent });
        },
      });

      expect(stages).toContainEqual({ stage: 'loading-template', percent: 0 });
      expect(stages).toContainEqual({ stage: 'creating-background', percent: 10 });
      expect(stages).toContainEqual({ stage: 'processing-photo', percent: 30 });
      expect(stages).toContainEqual({ stage: 'compositing-photo', percent: 50 });
      expect(stages).toContainEqual({ stage: 'rendering-text', percent: 70 });
      expect(stages).toContainEqual({ stage: 'encoding-output', percent: 90 });
      expect(stages).toContainEqual({ stage: 'complete', percent: 100 });
    });

    it('works with modern template', async () => {
      // Modern template has the same text field IDs as classic:
      // athleteName, achievement, tournamentName, date
      // This is verified by checking modern.ts field definitions
      const modernData = {
        athleteName: 'Test Athlete',
        achievement: 'Champion',
        tournamentName: 'Modern Tournament',
        date: 'January 2026',
      };

      const result = await composePoster({
        templateId: 'modern',
        athletePhoto: validPhoto,
        data: modernData,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.metadata.width).toBe(1080);
    });
  });
});
