import sharp from 'sharp';
import { logger } from '../logger.js';
import { loadTemplate } from '../templates/index.js';
import { InvalidInputError, ImageProcessingError } from './errors.js';
import { createCanvas } from './canvas.js';
import { compositeImage } from './composite.js';
import { addText } from './text.js';
import { convertTemplatePosition } from './position-utils.js';
import type { PosterTemplate, TemplateBackground } from '../templates/types.js';
import type { CanvasFill, TextLayer } from './types.js';

/**
 * Output format options for composed poster
 */
export interface OutputOptions {
  /** Output format (default: 'png') */
  format?: 'png' | 'jpeg';
  /** JPEG quality 1-100 (default: 85) */
  quality?: number;
  /** Resize the output */
  resize?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
  };
}

/**
 * Options for composing a poster
 */
export interface ComposePosterOptions {
  /** Template ID to use (e.g., 'classic', 'modern') */
  templateId: string;
  /** Athlete photo as Buffer */
  athletePhoto: Buffer;
  /** Data keyed by template field IDs */
  data: Record<string, string>;
  /** Output format options */
  output?: OutputOptions;
  /** Progress callback */
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Result from composing a poster
 */
export interface ComposePosterResult {
  /** The composed image buffer */
  buffer: Buffer;
  /** Image metadata */
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Progress stages for poster composition
 */
export const COMPOSE_STAGES = {
  LOADING_TEMPLATE: { name: 'loading-template', percent: 0 },
  CREATING_BACKGROUND: { name: 'creating-background', percent: 10 },
  PROCESSING_PHOTO: { name: 'processing-photo', percent: 30 },
  COMPOSITING_PHOTO: { name: 'compositing-photo', percent: 50 },
  RENDERING_TEXT: { name: 'rendering-text', percent: 70 },
  ENCODING_OUTPUT: { name: 'encoding-output', percent: 90 },
} as const;

/**
 * Validate that all required template fields have data
 */
function validateTemplateData(template: PosterTemplate, data: Record<string, string>): void {
  const missingFields: string[] = [];

  for (const textField of template.text) {
    if (!(textField.id in data) || data[textField.id] === undefined || data[textField.id] === '') {
      missingFields.push(textField.id);
    }
  }

  if (missingFields.length > 0) {
    throw new InvalidInputError(`Missing required data fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Validate that the photo buffer is a valid image
 */
async function validatePhoto(photo: Buffer): Promise<void> {
  try {
    const metadata = await sharp(photo).metadata();
    if (!metadata.width || !metadata.height) {
      throw new InvalidInputError('Photo buffer is not a valid image');
    }
  } catch (error) {
    if (error instanceof InvalidInputError) {
      throw error;
    }
    throw new InvalidInputError(
      `Invalid photo: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert template background to canvas fill
 */
function templateBackgroundToFill(background: TemplateBackground): CanvasFill {
  if (background.type === 'solid') {
    return { type: 'solid', color: background.color };
  }
  if (background.type === 'gradient') {
    return {
      type: 'gradient',
      direction: background.direction,
      stops: background.stops,
    };
  }
  // Image backgrounds not yet supported
  throw new InvalidInputError('Image backgrounds are not yet supported');
}

/**
 * Compose a complete poster from template, photo, and data.
 *
 * @param options - Composition options
 * @returns The composed poster buffer and metadata
 * @throws {TemplateNotFoundError} If template doesn't exist
 * @throws {InvalidInputError} If validation fails
 * @throws {ImageProcessingError} If image processing fails
 *
 * @example
 * ```typescript
 * import { composePoster, initBundledFonts } from '@bjj-poster/core';
 *
 * await initBundledFonts();
 *
 * const result = await composePoster({
 *   templateId: 'classic',
 *   athletePhoto: photoBuffer,
 *   data: {
 *     athleteName: 'João Silva',
 *     achievement: 'Gold Medal',
 *     tournamentName: 'World Championship 2025',
 *     date: 'June 2025',
 *   },
 *   onProgress: (stage, percent) => console.log(`${stage}: ${percent}%`),
 * });
 *
 * await writeFile('./poster.png', result.buffer);
 * ```
 */
export async function composePoster(options: ComposePosterOptions): Promise<ComposePosterResult> {
  const { templateId, athletePhoto, data, output, onProgress } = options;

  try {
    // Stage: loading-template (0%)
    onProgress?.(COMPOSE_STAGES.LOADING_TEMPLATE.name, COMPOSE_STAGES.LOADING_TEMPLATE.percent);
    logger.debug('composePoster: loading template', { templateId });

    const template = loadTemplate(templateId);
    validateTemplateData(template, data);
    await validatePhoto(athletePhoto);

    // Stage: creating-background (10%)
    onProgress?.(COMPOSE_STAGES.CREATING_BACKGROUND.name, COMPOSE_STAGES.CREATING_BACKGROUND.percent);
    logger.debug('composePoster: creating background');

    const fill = templateBackgroundToFill(template.background);
    const canvas = await createCanvas({
      width: template.canvas.width,
      height: template.canvas.height,
      fill,
    });

    // Stage: processing-photo (30%)
    onProgress?.(COMPOSE_STAGES.PROCESSING_PHOTO.name, COMPOSE_STAGES.PROCESSING_PHOTO.percent);
    logger.debug('composePoster: processing photo');

    // Get the first photo field from template
    const photoField = template.photos[0];
    if (!photoField) {
      throw new InvalidInputError('Template has no photo field defined');
    }

    // Convert template position to absolute coordinates
    const photoPos = convertTemplatePosition(photoField.position, template.canvas);

    // Stage: compositing-photo (50%)
    onProgress?.(COMPOSE_STAGES.COMPOSITING_PHOTO.name, COMPOSE_STAGES.COMPOSITING_PHOTO.percent);
    logger.debug('composePoster: compositing photo');

    // Calculate position adjusted for centering (position is center point, need top-left)
    const composited = await compositeImage({
      background: canvas,
      layers: [
        {
          image: athletePhoto,
          position: {
            x: Math.round(photoPos.x - photoField.size.width / 2),
            y: Math.round(photoPos.y - photoField.size.height / 2),
          },
          size: photoField.size,
          mask: photoField.mask,
          border: photoField.border,
          shadow: photoField.shadow
            ? {
                blur: photoField.shadow.blur,
                offsetX: photoField.shadow.offsetX,
                offsetY: photoField.shadow.offsetY,
                color: photoField.shadow.color,
              }
            : undefined,
        },
      ],
    });

    // Stage: rendering-text (70%)
    onProgress?.(COMPOSE_STAGES.RENDERING_TEXT.name, COMPOSE_STAGES.RENDERING_TEXT.percent);
    logger.debug('composePoster: rendering text', { fieldCount: template.text.length });

    // Convert template text fields to text layers
    const textLayers: TextLayer[] = template.text.map((field) => {
      const pos = convertTemplatePosition(field.position, template.canvas);
      return {
        content: data[field.id],
        position: { x: pos.x, y: pos.y },
        style: field.style,
      };
    });

    const withText = await addText({
      image: composited,
      layers: textLayers,
    });

    // Stage: encoding-output (90%)
    onProgress?.(COMPOSE_STAGES.ENCODING_OUTPUT.name, COMPOSE_STAGES.ENCODING_OUTPUT.percent);
    logger.debug('composePoster: encoding output');

    let outputImage = withText;

    // Apply resize if requested
    if (output?.resize) {
      outputImage = outputImage.resize({
        width: output.resize.width,
        height: output.resize.height,
        fit: output.resize.fit ?? 'contain',
      });
    }

    // Encode to requested format
    const format = output?.format ?? 'png';
    let buffer: Buffer;

    if (format === 'jpeg') {
      buffer = await outputImage.jpeg({ quality: output?.quality ?? 85 }).toBuffer();
    } else {
      buffer = await outputImage.png().toBuffer();
    }

    // Get final metadata
    const metadata = await sharp(buffer).metadata();

    logger.debug('composePoster: complete', {
      width: metadata.width,
      height: metadata.height,
      format,
      size: buffer.length,
    });

    return {
      buffer,
      metadata: {
        width: metadata.width!,
        height: metadata.height!,
        format,
        size: buffer.length,
      },
    };
  } catch (error) {
    if (error instanceof InvalidInputError || error instanceof ImageProcessingError) {
      throw error;
    }

    // Check for template errors
    if (error && typeof error === 'object' && 'name' in error) {
      if ((error as Error).name === 'TemplateNotFoundError') {
        throw error;
      }
    }

    logger.error('composePoster failed', { error });
    throw new ImageProcessingError(
      `Failed to compose poster: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
