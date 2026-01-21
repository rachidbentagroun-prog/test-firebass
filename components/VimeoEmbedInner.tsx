import React, { useRef, useEffect } from 'react';

interface VimeoEmbedInnerProps {
  url: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

const getVimeoUrlWithAutoplay = (url: string) => {
  const u = new URL(url);
  u.searchParams.set('autoplay', '0'); // We'll trigger play manually
  u.searchParams.set('muted', '0');   // Allow sound
  u.searchParams.set('playsinline', '1');
  return u.toString();
};

const VimeoEmbedInner: React.FC<VimeoEmbedInnerProps> = ({ url, title, className, style }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    let observer: IntersectionObserver | null = null;
    let player: any = null;
    const onIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Load Vimeo Player API
          if (!player) {
            // @ts-ignore
            player = new window.Vimeo.Player(iframe);
          }
          player.setVolume(1);
          player.play();
        } else {
          if (player) player.pause();
        }
      });
    };
    observer = new window.IntersectionObserver(onIntersect, { threshold: 0.5 });
    observer.observe(iframe);
    return () => {
      if (observer) observer.disconnect();
    };
  }, []);
  return (
    <iframe
      ref={iframeRef}
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
