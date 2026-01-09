'use client';

import { useState } from 'react';
import { X, Link2, Instagram, Facebook, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterUrl: string;
  posterTitle: string;
}

export function ShareModal({
  isOpen,
  onClose,
  posterUrl,
  posterTitle,
}: ShareModalProps): JSX.Element | null {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(posterUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(`Check out my ${posterTitle} poster!`);
  const encodedUrl = encodeURIComponent(posterUrl);

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wide text-white">
            Share Poster
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-4 gap-3">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-surface-800"
            aria-label="Copy link"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-800">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-surface-400">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-surface-800"
            aria-label="Instagram"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-surface-400">Instagram</span>
          </a>

          {/* Facebook */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-surface-800"
            aria-label="Facebook"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <Facebook className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-surface-400">Facebook</span>
          </a>

          {/* Twitter/X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-surface-800"
            aria-label="Twitter"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black">
              <Twitter className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-surface-400">X</span>
          </a>
        </div>
      </div>
    </div>
  );
}
