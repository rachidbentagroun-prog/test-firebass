
import { PixelCrop } from 'react-image-crop';

export interface ImageFilters {
  brightness: number; // 100 is default
  contrast: number;   // 100 is default
  saturation: number; // 100 is default
  grayscale: number;  // 0 is default
  sepia: number;      // 0 is default
}

export type WatermarkPosition = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'center-left' | 'center' | 'center-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WatermarkPreset {
  id: string;
  name: string;
  url: string;
  defaultOpacity: number;
  defaultScale: number;
}

export const WATERMARK_PRESETS: WatermarkPreset[] = [
  {
    id: 'imaginai-dark',
    name: 'ImaginAI (Dark)',
    url: 'https://cdn-icons-png.flaticon.com/512/9425/9425822.png',
    defaultOpacity: 0.6,
    defaultScale: 0.15
  },
  {
    id: 'imaginai-light',
    name: 'ImaginAI (Light)',
    url: 'https://cdn-icons-png.flaticon.com/512/2956/2956744.png',
    defaultOpacity: 0.4,
    defaultScale: 0.12
  },
  {
    id: 'shot-on',
    name: 'Shot on AI',
    url: 'https://cdn-icons-png.flaticon.com/512/685/685655.png',
    defaultOpacity: 0.5,
    defaultScale: 0.1
  },
  {
    id: 'certified',
    name: 'Certified Art',
    url: 'https://cdn-icons-png.flaticon.com/512/1042/1042210.png',
    defaultOpacity: 0.7,
    defaultScale: 0.18
  },
  {
    id: 'signature',
    name: 'Artist Signature',
    url: 'https://cdn-icons-png.flaticon.com/512/32/32339.png',
    defaultOpacity: 0.3,
    defaultScale: 0.2
  }
];

export interface WatermarkSettings {
  enabled: boolean;
  url: string | null;
  opacity: number; // 0 to 1
  scale: number;   // 0.1 to 1 (percentage of image width)
  position: WatermarkPosition;
}

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
};

export const DEFAULT_WATERMARK: WatermarkSettings = {
  enabled: false,
  url: WATERMARK_PRESETS[0].url,
  opacity: 0.5,
  scale: 0.2,
  position: 'bottom-right',
};

export function getFilterString(filters: ImageFilters): string {
  return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;
}

export async function getCanvasBlob(
  imageSrc: string,
  crop: PixelCrop | null,
  filters: ImageFilters,
  watermark: WatermarkSettings
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const pixelCrop = crop || {
    unit: 'px',
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  };

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 1. Apply filters
  ctx.filter = getFilterString(filters);

  // 2. Draw image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // 3. Apply Watermark
  if (watermark.enabled && watermark.url) {
    try {
      const wmImg = await createImage(watermark.url);
      ctx.filter = 'none';
      ctx.globalAlpha = watermark.opacity;

      const wmAspect = wmImg.width / wmImg.height;
      let wmWidth = canvas.width * watermark.scale;
      let wmHeight = wmWidth / wmAspect;

      const padding = Math.min(canvas.width, canvas.height) * 0.05;

      let x = 0;
      let y = 0;

      if (watermark.position.includes('left')) x = padding;
      else if (watermark.position.includes('right')) x = canvas.width - wmWidth - padding;
      else x = (canvas.width - wmWidth) / 2;

      if (watermark.position.includes('top')) y = padding;
      else if (watermark.position.includes('bottom')) y = canvas.height - wmHeight - padding;
      else y = (canvas.height - wmHeight) / 2;

      ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
    } catch (error) {
      console.error("Failed to apply watermark", error);
    }
  }

  return canvas.toDataURL('image/png');
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });
}
