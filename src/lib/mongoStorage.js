import { MongoClient } from 'mongodb';

class MongoStorage {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  /**
   * Conecta a MongoDB
   */
  async connect() {
    if (this.db) return this.db;

    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const dbName = process.env.MONGODB_DB || 'sticker-world';

      this.client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      this.collection = this.db.collection('sticker-sessions');

      // Crear índice TTL para auto-limpieza (documentos expiran después de 1 hora)
      await this.collection.createIndex(
        { "expiresAt": 1 },
        { expireAfterSeconds: 0 }
      );

      console.log('Connected to MongoDB');
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Guarda una sesión de stickers completa
   */
  async saveSession(sessionId, stickers, metadata) {
    try {
      await this.connect();

      const document = {
        sessionId,
        stickers: stickers.map((sticker, index) => ({
          index,
          ...sticker,
          savedAt: new Date()
        })),
        metadata: {
          ...metadata,
          totalStickers: stickers.length,
          successful: stickers.filter(s => !s.error).length,
          failed: stickers.filter(s => s.error).length
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // Expira en 1 hora
      };

      const result = await this.collection.replaceOne(
        { sessionId },
        document,
        { upsert: true }
      );

      console.log(`Saved session ${sessionId} to MongoDB`);
      return { success: true, result };
    } catch (error) {
      console.error(`Error saving session ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Guarda un sticker individual
   */
  async saveStickerIndividual(sessionId, stickerIndex, sticker) {
    try {
      await this.connect();

      const updateResult = await this.collection.updateOne(
        { sessionId },
        {
          $set: {
            [`stickers.${stickerIndex}`]: {
              index: stickerIndex,
              ...sticker,
              savedAt: new Date()
            },
            expiresAt: new Date(Date.now() + 60 * 60 * 1000)
          },
          $setOnInsert: {
            sessionId,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      return { success: true, result: updateResult };
    } catch (error) {
      console.error(`Error saving sticker ${sessionId}_${stickerIndex}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Carga una sesión completa
   */
  async loadSession(sessionId) {
    try {
      await this.connect();

      const session = await this.collection.findOne({ sessionId });

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Actualizar tiempo de expiración al acceder
      await this.collection.updateOne(
        { sessionId },
        { $set: { expiresAt: new Date(Date.now() + 60 * 60 * 1000) } }
      );

      return {
        success: true,
        data: {
          sessionId: session.sessionId,
          stickers: session.stickers,
          metadata: session.metadata,
          createdAt: session.createdAt
        }
      };
    } catch (error) {
      console.error(`Error loading session ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualiza metadata de una sesión
   */
  async updateSessionMetadata(sessionId, metadata) {
    try {
      await this.connect();

      const result = await this.collection.updateOne(
        { sessionId },
        {
          $set: {
            metadata: {
              ...metadata,
              updatedAt: new Date()
            },
            expiresAt: new Date(Date.now() + 60 * 60 * 1000)
          }
        }
      );

      return { success: true, result };
    } catch (error) {
      console.error(`Error updating session metadata ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpia sesiones expiradas manualmente (opcional, MongoDB lo hace automáticamente con TTL)
   */
  async cleanupExpiredSessions() {
    try {
      await this.connect();

      const result = await this.collection.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`Cleaned up ${result.deletedCount} expired sessions`);
      return { success: true, deleted: result.deletedCount };
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cierra la conexión
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.collection = null;
      console.log('MongoDB connection closed');
    }
  }
}

// Singleton para reutilizar conexión
let mongoStorage = null;

export function getMongoStorage() {
  if (!mongoStorage) {
    mongoStorage = new MongoStorage();
  }
  return mongoStorage;
}

export default MongoStorage;