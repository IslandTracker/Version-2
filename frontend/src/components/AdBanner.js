import React from 'react';

const AdSizes = {
  LEADERBOARD: { width: 728, height: 90, name: 'Leaderboard' },
  LARGE_LEADERBOARD: { width: 970, height: 90, name: 'Large Leaderboard' },
  MEDIUM_RECTANGLE: { width: 300, height: 250, name: 'Medium Rectangle' },
  LARGE_RECTANGLE: { width: 336, height: 280, name: 'Large Rectangle' },
  HALF_PAGE: { width: 300, height: 600, name: 'Half Page' },
  MOBILE_BANNER: { width: 320, height: 50, name: 'Mobile Banner' },
  LARGE_MOBILE_BANNER: { width: 320, height: 100, name: 'Large Mobile Banner' },
  BILLBOARD: { width: 970, height: 250, name: 'Billboard' },
  WIDE_SKYSCRAPER: { width: 160, height: 600, name: 'Wide Skyscraper' },
};

const AdBanner = ({ 
  size = 'LEADERBOARD',
  className = '',
  label = true,
  responsive = true,
  position = '' 
}) => {
  const adSize = AdSizes[size] || AdSizes.LEADERBOARD;
  
  // Get mobile alternative if responsive and we're dealing with a desktop banner
  let mobileSize = null;
  if (responsive) {
    if (size === 'LEADERBOARD' || size === 'LARGE_LEADERBOARD') {
      mobileSize = AdSizes.MOBILE_BANNER;
    } else if (size === 'BILLBOARD') {
      mobileSize = AdSizes.MEDIUM_RECTANGLE;
    } else if (size === 'WIDE_SKYSCRAPER' || size === 'HALF_PAGE') {
      mobileSize = AdSizes.MEDIUM_RECTANGLE;
    }
  }
  
  // Set a background color with very slight opacity for visibility
  const bgColor = position === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  
  return (
    <div className={`ad-container ${className} border border-gray-200 p-2 rounded`}>
      {label && (
        <div className="text-xs text-gray-500 mb-1 text-center">ADVERTISEMENT</div>
      )}
      
      {/* Desktop Ad */}
      <div 
        className={`hidden md:flex items-center justify-center ${bgColor} border border-gray-300`}
        style={{ 
          width: adSize.width, 
          height: adSize.height,
          maxWidth: '100%'
        }}
      >
        <span className="text-gray-400 text-sm">{adSize.width}×{adSize.height}</span>
      </div>
      
      {/* Mobile Ad (if responsive) */}
      {mobileSize && (
        <div 
          className={`flex md:hidden items-center justify-center ${bgColor} border border-gray-300 mx-auto`}
          style={{ 
            width: mobileSize.width, 
            height: mobileSize.height,
            maxWidth: '100%'
          }}
        >
          <span className="text-gray-400 text-sm">{mobileSize.width}×{mobileSize.height}</span>
        </div>
      )}
    </div>
  );
};

export default AdBanner;