/**
 * ALINEA DESAIN - IMAGE UPLOAD & COMPRESSION HELPER
 * Mendukung format file gambar: PNG, JPG, JPEG, dan WEBP
 * Otomatis mengompresi gambar di sisi browser agar ringan dan cepat saat disimpan
 */

export const SUPPORTED_IMAGE_FORMATS = ['.png', '.jpg', '.jpeg', '.webp'];
export const SUPPORTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Validasi apakah file merupakan format PNG, JPG, JPEG, atau WEBP
 */
export function isValidImageFile(file: File): boolean {
  if (!file) return false;
  const fileName = file.name.toLowerCase();
  const isExtensionValid = SUPPORTED_IMAGE_FORMATS.some((ext) => fileName.endsWith(ext));
  const isMimeValid = SUPPORTED_IMAGE_MIME_TYPES.includes(file.type);
  return isExtensionValid || isMimeValid;
}

/**
 * Membaca dan mengompresi file gambar (PNG, JPG, WEBP) menjadi Data URL Base64 yang ringan
 * @param file Objek File dari input file browser
 * @param maxWidth Ukuran lebar maksimum (default 1024px)
 * @param maxHeight Ukuran tinggi maksimum (default 1024px)
 * @param quality Kualitas kompresi (0.1 - 1.0, default 0.82)
 */
export function compressAndConvertImageFile(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isValidImageFile(file)) {
      return reject(
        new Error('Format file tidak didukung! Harap unggah gambar dengan format PNG, JPG, atau WEBP.')
      );
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar dari perangkat Anda.'));
    };

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        return reject(new Error('Gagal memproses file gambar.'));
      }

      // Buat objek gambar di memori untuk menghitung skala & kompresi canvas
      const img = new Image();
      img.onerror = () => {
        // Fallback kembalikan data URL langsung jika elemen Image gagal
        resolve(dataUrl);
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Hitung rasio aspek untuk mempertahankan proporsi
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(dataUrl);
          }

          // Atur smoothing untuk kualitas terbaik
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Jika format file asli adalah PNG dan transparan, pertahankan PNG
          const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
          const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');

          if (!isPng && !isWebp) {
            // Gambar JPG tidak punya transparansi, beri latar belakang putih bersih
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Tentukan format output: WEBP untuk efisiensi tinggi, atau format asli
          let outputMime = 'image/jpeg';
          if (isPng) outputMime = 'image/png';
          else if (isWebp) outputMime = 'image/webp';

          // Coba ekspor dengan kualitas kompresi
          const compressedDataUrl = canvas.toDataURL(outputMime, isPng ? undefined : quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas compression error, using original data URL:', err);
          resolve(dataUrl);
        }
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
