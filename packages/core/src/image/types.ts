/**
 * Image metadata returned from analysis
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
}

/**
 * Position can be pixel coordinates or named anchor
 */
export type Position =
  | { x: number; y: number }
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'left-center'
  | 'right-center';

/**
 * Shape mask for images
 */
export type MaskShape =
  | { type: 'none' }
  | { type: 'circle' }
  | { type: 'rounded-rect'; radius: number };

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
