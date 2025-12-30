export { loadImage, getImageMetadata } from './loader.js';
export { createCanvas } from './canvas.js';
export { compositeImage } from './composite.js';
export { ImageProcessingError, InvalidInputError } from './errors.js';
export type {
  ImageMetadata,
  GradientDirection,
  GradientStop,
  CanvasFill,
  CanvasOptions,
  Position,
  MaskShape,
} from './types.js';
export type { CompositeLayer, CompositeOptions } from './composite.js';
