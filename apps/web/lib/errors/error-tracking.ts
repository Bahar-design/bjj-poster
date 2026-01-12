export type ErrorType =
  | 'photo_too_large'
  | 'photo_invalid_format'
  | 'photo_upload_failed'
  | 'generation_timeout'
  | 'generation_api_failure'
  | 'quota_exceeded'
  | 'network_offline'
  | 'api_unreachable'
  | 'form_validation_error';

export interface ErrorContext {
  [key: string]: string | number | boolean | undefined;
}

export function trackError(type: ErrorType, context?: ErrorContext): void {
  const errorEvent = {
    type,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.pathname : undefined,
  };

  console.error('[Error Tracked]', errorEvent);

  // TODO: Send to analytics service (Amplitude, Segment, etc.)
}
