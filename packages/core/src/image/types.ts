/**
 * Image metadata returned from analysis
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
}

/**
 * Gradient direction for backgrounds
 */
export type GradientDirection = 'to-bottom' | 'to-right' | 'to-bottom-right' | 'radial';

/**
 * Gradient color stop
 */
export interface GradientStop {
  /** Hex color (e.g., #ff5733) */
  color: string;
  /** Position as percentage (0-100) */
  position: number;
}

/**
 * Fill options for canvas creation
 */
export type CanvasFill =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; direction: GradientDirection; stops: GradientStop[] };

/**
 * Options for creating a canvas
 */
export interface CanvasOptions {
  width: number;
  height: number;
  fill: CanvasFill;
}
