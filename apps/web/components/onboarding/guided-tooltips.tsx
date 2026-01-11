'use client';

import { useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="photo-upload"]',
    content: (
      <div className="text-left">
        <p className="font-bold text-white mb-1">
          👆 Tap here to replace with your photo.
        </p>
        <p className="text-surface-300 text-sm">
          Take a photo or choose from library.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="template-selector"]',
    content: (
      <div className="text-left">
        <p className="font-bold text-white mb-1">🎨 Try different templates.</p>
        <p className="text-surface-300 text-sm">Swipe to see more styles.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="generate-button"]',
    content: (
      <div className="text-left">
        <p className="font-bold text-white mb-1">
          ⚡ Tap to create your poster.
        </p>
        <p className="text-surface-300 text-sm">Takes about 15 seconds.</p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

const JOYRIDE_STYLES = {
  options: {
    backgroundColor: '#1a1a1a',
    textColor: '#f5f5f5',
    primaryColor: '#d4af37',
    overlayColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
    arrowColor: '#1a1a1a',
  },
  tooltip: {
    borderRadius: 8,
    border: '1px solid #404040',
    padding: '16px',
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  buttonNext: {
    backgroundColor: '#d4af37',
    color: '#000000',
    fontWeight: 'bold',
    borderRadius: 6,
    padding: '8px 16px',
  },
  buttonBack: {
    color: '#a3a3a3',
    marginRight: 8,
  },
  buttonSkip: {
    color: '#a3a3a3',
  },
  buttonClose: {
    color: '#a3a3a3',
  },
  spotlight: {
    borderRadius: 8,
  },
};

interface GuidedTooltipsProps {
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTooltips({
  run,
  onComplete,
  onSkip,
}: GuidedTooltipsProps): JSX.Element | null {
  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;

      if (status === STATUS.FINISHED) {
        onComplete();
      } else if (status === STATUS.SKIPPED) {
        onSkip();
      }
    },
    [onComplete, onSkip]
  );

  if (!run) {
    return null;
  }

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose={false}
      callback={handleCallback}
      styles={JOYRIDE_STYLES}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip tour',
      }}
      floaterProps={{
        hideArrow: false,
      }}
    />
  );
}
