export interface ImageProcessOptions {
  maxSize?: number;
  preserveTransparency?: boolean;
  quality?: number;
  maxFileSizeBytes?: number;
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml'
]);

export function fileToCompressedDataUrl(
  file: File,
  options: ImageProcessOptions = {}
): Promise<string> {
  const {
    maxSize = 320,
    preserveTransparency = false,
    quality = 0.86,
    maxFileSizeBytes = 5 * 1024 * 1024
  } = options;

  return new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      reject(new Error('Formato no compatible. Utiliza una imagen PNG, JPG, WEBP o SVG.'));
      return;
    }

    if (file.size > maxFileSizeBytes) {
      reject(new Error('El archivo excede el tamaño máximo permitido de 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();

      img.onerror = () => reject(new Error('La imagen seleccionada no es válida o está dañada.'));
      img.onload = () => {
        try {
          const srcW = img.naturalWidth || img.width || maxSize;
          const srcH = img.naturalHeight || img.height || maxSize;
          const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
          const targetW = Math.max(1, Math.round(srcW * scale));
          const targetH = Math.max(1, Math.round(srcH * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          if (!preserveTransparency) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetW, targetH);
          } else {
            ctx.clearRect(0, 0, targetW, targetH);
          }

          ctx.drawImage(img, 0, 0, targetW, targetH);

          const outputMime = preserveTransparency ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(outputMime, quality);
          resolve(compressed);
        } catch {
          resolve(rawDataUrl);
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
