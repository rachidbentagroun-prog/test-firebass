import dynamic from 'next/dynamic';

const VimeoEmbed = dynamic(() => import('./VimeoEmbedInner'), { ssr: false });

export default VimeoEmbed;
