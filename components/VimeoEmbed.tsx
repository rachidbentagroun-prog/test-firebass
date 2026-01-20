
import React, { Suspense } from 'react';

const VimeoEmbedInner = React.lazy(() => import('./VimeoEmbedInner'));

const VimeoEmbed = (props) => (
	<Suspense fallback={<div>Loading...</div>}>
		<VimeoEmbedInner {...props} />
	</Suspense>
);

export default VimeoEmbed;
