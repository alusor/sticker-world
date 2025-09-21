import { getMongoStorage } from '@/lib/mongoStorage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    const mongoStorage = getMongoStorage();

    // Obtener las últimas 10 sesiones ordenadas por fecha de creación
    const recentSessions = await mongoStorage.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Transformar los datos para la galería
    const galleryData = recentSessions.map(session => {
      // Obtener solo los stickers exitosos
      const successfulStickers = session.stickers.filter(sticker => !sticker.error && sticker.data);

      // Tomar solo el primer sticker como preview (sin el base64 completo)
      const previewSticker = successfulStickers[0];

      return {
        sessionId: session.sessionId,
        style: session.metadata?.style || 'unknown',
        createdAt: session.createdAt,
        totalStickers: session.stickers.length,
        successfulStickers: successfulStickers.length,
        previewExists: !!previewSticker,
        // Solo incluir una muestra pequeña del base64 para verificar que existe
        hasPreviewData: !!(previewSticker?.data && previewSticker.data.length > 0)
      };
    });

    res.status(200).json({
      success: true,
      sessions: galleryData,
      total: galleryData.length
    });

  } catch (error) {
    console.error('Error fetching recent sessions:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch recent sessions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}