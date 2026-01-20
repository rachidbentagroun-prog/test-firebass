import React from 'react';

interface VimeoEmbedInnerProps {
  url: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

const getVimeoUrlWithAutoplay = (url: string) => {
  const u = new URL(url);
  u.searchParams.set('autoplay', '1');
  u.searchParams.set('muted', '1');
  u.searchParams.set('playsinline', '1');
  return u.toString();
};

const VimeoEmbedInner: React.FC<VimeoEmbedInnerProps> = ({ url, title, className, style }) => {
  if (typeof window === 'undefined') return null;
  return (
    <iframe
      src={getVimeoUrlWithAutoplay(url)}
      width="100%"
      height="100%"
      frameBorder="0"
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
      allowFullScreen
      title={title}
      className={className}
      referrerPolicy="strict-origin-when-cross-origin"
      style={style}
    />
  );
};

export default VimeoEmbedInner;
