// MamaTrack GPS — Line icons for overlay surfaces
//
// Drawn inline rather than pulled from an icon font so that a toast never waits
// on a webfont to render, and so the stroke colour inherits from the variant.

import React from 'react';

interface IconProps {
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
});

export const CheckIcon: React.FC<IconProps> = ({ size = 17 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
  </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ size = 17 }) => (
  <svg {...base(size)}>
    <path d="M10.3 4.3 2.9 17a1.9 1.9 0 0 0 1.7 2.9h14.8a1.9 1.9 0 0 0 1.7-2.9L13.7 4.3a1.9 1.9 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const ErrorIcon: React.FC<IconProps> = ({ size = 17 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.8v4.6" />
    <path d="M12 16.1h.01" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size = 17 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 7.9h.01" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 14 }) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 17 }) => (
  <svg {...base(size)}>
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 12.1a1.9 1.9 0 0 0 1.9 1.9h6.2a1.9 1.9 0 0 0 1.9-1.9L18 7" />
    <path d="M9 7V4.9A.9.9 0 0 1 9.9 4h4.2a.9.9 0 0 1 .9.9V7" />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ size = 17 }) => (
  <svg {...base(size)}>
    <path d="M12 3.5v11" />
    <path d="m7.8 10.5 4.2 4.2 4.2-4.2" />
    <path d="M4.5 19.5h15" />
  </svg>
);
