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
    const healthResult = await mongoStorage.healthCheck();

    // Determinar status code basado en el resultado
    const statusCode = healthResult.success ? 200 : 503;

    // Headers para evitar cache en health checks
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(statusCode).json({
      service: 'sticker-world-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      mongodb: healthResult,
      environmentVariables: {
        MONGODB_URI: !!process.env.MONGODB_URI,
        MONGODB_DB: !!process.env.MONGODB_DB,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(503).json({
      service: 'sticker-world-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      mongodb: {
        success: false,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      environmentVariables: {
        MONGODB_URI: !!process.env.MONGODB_URI,
        MONGODB_DB: !!process.env.MONGODB_DB,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
      },
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}