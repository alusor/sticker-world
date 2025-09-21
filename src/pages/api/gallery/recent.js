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

    // Asegurar conexión antes de consultar
    await mongoStorage.ensureConnection();

    if (!mongoStorage.collection) {
      throw new Error('MongoDB collection not available');
    }

    // Obtener las últimas 10 sesiones excluyendo solo el base64 data
    const recentSessions = await mongoStorage.collection
      .find({}, {
        projection: {
          'stickers.data': 0  // Solo exclusión del campo grande
        }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Transformar los datos para la galería
    const galleryData = recentSessions.map(session => {
      if (!session.stickers || !Array.isArray(session.stickers)) {
        return {
          sessionId: session.sessionId,
          style: session.metadata?.style || 'unknown',
          createdAt: session.createdAt,
          totalStickers: 0,
          successfulStickers: 0,
          previewExists: false,
          hasPreviewData: false
        };
      }

      // Obtener solo los stickers exitosos (sin verificar data ya que lo excluimos)
      const successfulStickers = session.stickers.filter(sticker => !sticker.error);

      return {
        sessionId: session.sessionId,
        style: session.metadata?.style || 'unknown',
        createdAt: session.createdAt,
        totalStickers: session.stickers.length,
        successfulStickers: successfulStickers.length,
        previewExists: successfulStickers.length > 0,
        // Asumir que hay data si no hay error
        hasPreviewData: successfulStickers.length > 0
      };
    });

    // Agregar headers de cache
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    res.status(200).json({
      success: true,
      sessions: galleryData,
      total: galleryData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching recent sessions:', error);

    // Determinar tipo de error específico
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (error.message.includes('MONGODB_URI') || error.message.includes('environment variable')) {
      statusCode = 500;
      errorMessage = 'Database configuration error';
      errorCode = 'CONFIG_ERROR';
    } else if (error.message.includes('connection') || error.message.includes('timeout')) {
      statusCode = 503;
      errorMessage = 'Database temporarily unavailable';
      errorCode = 'DATABASE_UNAVAILABLE';
    } else if (error.message.includes('collection not available')) {
      statusCode = 503;
      errorMessage = 'Database collection not accessible';
      errorCode = 'COLLECTION_ERROR';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      message: 'Failed to fetch recent sessions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      retryable: ['DATABASE_UNAVAILABLE', 'COLLECTION_ERROR'].includes(errorCode)
    });
  }
}