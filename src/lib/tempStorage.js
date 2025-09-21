import fs from 'fs';
import path from 'path';

class TempStorage {
  constructor() {
    // Directorio temporal para stickers
    this.tempDir = path.join(process.cwd(), 'public', 'temp-stickers');

    // Crear directorio si no existe
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Guarda un sticker en el disco temporal
   */
  saveStickerToDisk(sessionId, stickerIndex, base64Data, sticker) {
    try {
      const fileName = `${sessionId}_${stickerIndex}.png`;
      const filePath = path.join(this.tempDir, fileName);

      // Convertir base64 a buffer y guardarlo
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      // Crear metadata del sticker
      const metadataFileName = `${sessionId}_${stickerIndex}_meta.json`;
      const metadataPath = path.join(this.tempDir, metadataFileName);

      const metadata = {
        ...sticker,
        data: null, // No guardar el base64 en metadata
        filePath: `/temp-stickers/${fileName}`,
        fileSize: buffer.length,
        savedAt: Date.now()
      };

      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      return {
        success: true,
        filePath: `/temp-stickers/${fileName}`,
        metadata: metadata
      };
    } catch (error) {
      console.error(`Error saving sticker ${sessionId}_${stickerIndex}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Carga stickers desde el disco temporal
   */
  loadStickersFromDisk(sessionId, totalStickers = 6) {
    const loadedStickers = [];

    for (let i = 0; i < totalStickers; i++) {
      const metadataFileName = `${sessionId}_${i}_meta.json`;
      const metadataPath = path.join(this.tempDir, metadataFileName);

      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          loadedStickers.push(metadata);
        } catch (error) {
          console.error(`Error loading sticker ${sessionId}_${i}:`, error);
          // Agregar placeholder para sticker con error
          loadedStickers.push({
            id: `error_${i}`,
            name: `Sticker ${i + 1}`,
            emoji: '❌',
            error: 'Error loading from disk',
            index: i
          });
        }
      } else {
        // Agregar placeholder para sticker no encontrado
        loadedStickers.push({
          id: `missing_${i}`,
          name: `Sticker ${i + 1}`,
          emoji: '❓',
          error: 'File not found',
          index: i
        });
      }
    }

    return loadedStickers;
  }

  /**
   * Guarda información de la sesión
   */
  saveSessionInfo(sessionId, sessionData) {
    try {
      const sessionFileName = `${sessionId}_session.json`;
      const sessionPath = path.join(this.tempDir, sessionFileName);

      const sessionInfo = {
        ...sessionData,
        savedAt: Date.now()
      };

      fs.writeFileSync(sessionPath, JSON.stringify(sessionInfo, null, 2));
      return { success: true };
    } catch (error) {
      console.error(`Error saving session info ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Carga información de la sesión
   */
  loadSessionInfo(sessionId) {
    try {
      const sessionFileName = `${sessionId}_session.json`;
      const sessionPath = path.join(this.tempDir, sessionFileName);

      if (fs.existsSync(sessionPath)) {
        const sessionInfo = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        return { success: true, data: sessionInfo };
      } else {
        return { success: false, error: 'Session not found' };
      }
    } catch (error) {
      console.error(`Error loading session info ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpia archivos temporales antiguos (más de 1 hora)
   */
  cleanupOldFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hora

      let cleaned = 0;
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime.getTime() < oneHourAgo) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      });

      console.log(`Cleaned up ${cleaned} old temporary files`);
      return { success: true, cleaned };
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpia archivos de una sesión específica
   */
  cleanupSession(sessionId) {
    try {
      const files = fs.readdirSync(this.tempDir);
      let cleaned = 0;

      files.forEach(file => {
        if (file.startsWith(sessionId)) {
          const filePath = path.join(this.tempDir, file);
          fs.unlinkSync(filePath);
          cleaned++;
        }
      });

      console.log(`Cleaned up ${cleaned} files for session ${sessionId}`);
      return { success: true, cleaned };
    } catch (error) {
      console.error(`Error cleaning up session ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

export default TempStorage;