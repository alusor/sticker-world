/**
 * Comprime una imagen manteniendo calidad pero reduciendo tamaño
 */
export const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      const { width, height } = calculateDimensions(img.width, img.height, maxWidth);

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a blob con compresión
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Convertir blob a base64
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Error comprimiendo imagen'));
          }
        },
        'image/jpeg', // Usar JPEG para mejor compresión
        quality
      );
    };

    img.onerror = () => reject(new Error('Error cargando imagen'));

    // Cargar imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Calcula nuevas dimensiones manteniendo aspect ratio
 */
const calculateDimensions = (originalWidth, originalHeight, maxWidth) => {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalHeight / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(maxWidth * aspectRatio)
  };
};

/**
 * Obtiene información sobre el archivo de imagen
 */
export const getImageInfo = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        name: file.name
      });
    };

    img.onerror = () => reject(new Error('Error leyendo imagen'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};