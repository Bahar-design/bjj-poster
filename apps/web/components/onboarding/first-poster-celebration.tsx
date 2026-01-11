'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Facebook, Share2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirstPosterCelebration } from './use-first-poster-celebration';
import { useUserStore } from '@/lib/stores/user-store';
import { track } from '@/lib/analytics';

export function FirstPosterCelebration(): JSX.Element | null {
  const { showCelebration, posterData, hasDownloaded, markDownloaded, dismiss } =
    useFirstPosterCelebration();
  const subscriptionTier = useUserStore((s) => s.subscriptionTier);
  const postersThisMonth = useUserStore((s) => s.postersThisMonth);
  const postersLimit = useUserStore((s) => s.postersLimit);
  const [isDownloading, setIsDownloading] = useState(false);

  const postersRemaining = postersLimit - postersThisMonth;
  const showUpsell = subscriptionTier === 'free';

  // Track view on mount
  useEffect(() => {
    if (showCelebration) {
      track('first_poster_celebration_viewed', { tier: subscriptionTier });
    }
  }, [showCelebration, subscriptionTier]);

  const handleDownload = useCallback(async () => {
    if (!posterData?.imageUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(posterData.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'tournament-poster.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      markDownloaded();
      track('first_poster_downloaded', { tier: subscriptionTier });
    } catch (error) {
      console.error('Download failed:', error);
      // Still mark as downloaded so user can proceed
      markDownloaded();
    } finally {
      setIsDownloading(false);
    }
  }, [posterData, isDownloading, markDownloaded, subscriptionTier]);

  const handleShare = useCallback(async () => {
    if (!posterData?.imageUrl) return;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Tournament Poster',
          text: 'Check out my BJJ tournament poster!',
          url: posterData.imageUrl,
        });
        track('first_poster_shared', { platform: 'native_share', tier: subscriptionTier });
        return;
      } catch (error) {
        // User cancelled or share failed, fall through to copy
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(posterData.imageUrl);
      track('first_poster_shared', { platform: 'copy_link', tier: subscriptionTier });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [posterData, subscriptionTier]);

  const handleFacebookShare = useCallback(() => {
    if (!posterData?.imageUrl) return;

    const encodedUrl = encodeURIComponent(posterData.imageUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
    track('first_poster_shared', { platform: 'facebook', tier: subscriptionTier });
  }, [posterData, subscriptionTier]);

  const handleDismiss = useCallback(() => {
    track('first_poster_celebration_dismissed', { tier: subscriptionTier });
    dismiss();
  }, [dismiss, subscriptionTier]);

  if (!showCelebration || !posterData) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-surface-700 bg-surface-900 p-8 text-center shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <span className="text-4xl" role="img" aria-label="celebration">
            🎉
          </span>
          <h1
            id="celebration-title"
            className="mt-2 font-display text-3xl tracking-wide text-white"
          >
            Congratulations!
          </h1>
          <p className="mt-2 text-lg text-surface-300">
            You created your first tournament poster!
          </p>
        </div>

        {/* Poster Preview */}
        <div className="mb-6 flex justify-center">
          <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-lg border border-surface-700 shadow-2xl">
            <Image
              src={posterData.imageUrl}
              alt="Your generated poster"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Quota Reminder */}
        <p className="mb-6 text-sm text-surface-400">
          You have {postersRemaining} poster{postersRemaining !== 1 ? 's' : ''} left this month
          <span className="ml-1 text-surface-500">
            ({subscriptionTier === 'free' ? 'Free' : subscriptionTier === 'pro' ? 'Pro' : 'Premium'} plan)
          </span>
        </p>

        {/* Download Button */}
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="mr-2 h-5 w-5" />
          {isDownloading ? 'Downloading...' : 'Download Poster'}
        </Button>

        {/* Social Share (after download) */}
        {hasDownloaded && (
          <div className="mt-4 flex justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFacebookShare}
              aria-label="Share on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Upsell (free users only) */}
        {showUpsell && (
          <p className="mt-6 text-sm text-surface-400">
            Want unlimited posters?{' '}
            <Link
              href="/pricing"
              className="text-gold-500 hover:text-gold-400 transition-colors"
            >
              See Pro Plans
            </Link>
          </p>
        )}

        {/* Go to Dashboard (after download) */}
        {hasDownloaded && (
          <Button
            variant="ghost"
            className="mt-4 text-surface-400 hover:text-white"
            onClick={handleDismiss}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
