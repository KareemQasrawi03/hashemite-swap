/** Downscales an image file to at most 640px on its long side and re-encodes it as JPEG. */
export function resizePhoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(src);
      const k = Math.min(1, 640 / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.width * k));
      c.height = Math.max(1, Math.round(im.height * k));
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.72);
    };
    im.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error('decode failed'));
    };
    im.src = src;
  });
}
