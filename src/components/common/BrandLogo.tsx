import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  badge?: string;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  size = 'md',
  showIcon = false,
  badge,
  className = '',
  onClick,
}) => {
  const isDarkBg = variant === 'dark';
  const isAllGold = variant === 'gold';

  // Sizing scales
  const sizeClasses = {
    sm: {
      title: 'text-2xl sm:text-2xl',
      tagline: 'text-[11px] sm:text-xs -mt-1',
      badge: 'text-[9px] px-1.5 py-0.2',
    },
    md: {
      title: 'text-2xl sm:text-3xl',
      tagline: 'text-xs sm:text-sm -mt-1 sm:-mt-1.5',
      badge: 'text-[10px] px-2 py-0.5',
    },
    lg: {
      title: 'text-3xl sm:text-4xl',
      tagline: 'text-sm sm:text-base -mt-1.5 sm:-mt-2',
      badge: 'text-xs px-2.5 py-0.5',
    },
  }[size];

  // Color configurations matching global theme variables
  const getColors = () => {
    if (isDarkBg) {
      return {
        brandWord1: 'text-white',
        brandWord2: 'text-[#E8A33D]',
        tagline: 'text-[#E8A33D]',
        badgeBg: 'bg-[#E8A33D] text-[#14231C]',
      };
    }
    if (isAllGold) {
      return {
        brandWord1: 'text-[#E8A33D]',
        brandWord2: 'text-[#E8A33D]',
        tagline: 'text-[#D98A1B]',
        badgeBg: 'bg-[#1B4332]/10 text-[#1B4332]',
      };
    }
    // Default light background
    return {
      brandWord1: 'text-[#1B4332]',
      brandWord2: 'text-[#E8A33D]',
      tagline: 'text-[#D98A1B]',
      badgeBg: 'bg-[#E8A33D]/20 text-[#14231C] border border-[#E8A33D]/40',
    };
  };

  const colors = getColors();

  const content = (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="flex items-center gap-2 leading-none">
        <span
          className={`font-brand-script font-bold tracking-tight leading-none ${sizeClasses.title}`}
        >
          <span className={colors.brandWord1}>Ileya</span>{' '}
          <span className={colors.brandWord2}>Afrika</span>
        </span>
        {badge && (
          <span
            className={`font-sans font-extrabold uppercase rounded-full leading-none shrink-0 ${sizeClasses.badge} ${colors.badgeBg}`}
          >
            {badge}
          </span>
        )}
      </div>
      <span
        className={`font-brand-script font-medium tracking-wide leading-none pl-1 ${sizeClasses.tagline} ${colors.tagline}`}
      >
        home away from home
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="focus:outline-none text-left cursor-pointer group hover:opacity-95 transition-opacity"
      >
        {content}
      </button>
    );
  }

  return content;
};
