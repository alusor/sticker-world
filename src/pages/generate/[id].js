import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProgressTracker from '@/components/ui/ProgressTracker';

export default function GeneratePage() {
  const router = useRouter();
  const { id, style } = router.query;
  const [progress, setProgress] = useState({ current: 0, total: 6, status: 'starting', message: 'Preparando generación...', currentPose: null });
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id || !style) return;

    const startGeneration = async () => {
      try {
        // Recuperar datos de la sesión
        const sessionData = localStorage.getItem(`sticker_session_${id}`);
        if (!sessionData) {
          setIsError(true);
          setErrorMessage('Sesión no encontrada. Por favor, vuelve a crear los stickers.');
          return;
        }

        const { imageData } = JSON.parse(sessionData);

        // Simular progreso realista mientras se hace la llamada real
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev.current < prev.total - 1) {
              const poses = ['😴 Durmiendo', '😢 Triste', '😊 Feliz', '💻 Trabajando', '🛏️ Almohada', '🍽️ Hambriento'];
              return {
                ...prev,
                current: prev.current + 1,
                message: `Generando ${poses[prev.current]}...`,
                currentPose: poses[prev.current]
              };
            }
            return prev;
          });
        }, 2000);

        // Llamar al API de producción
        const response = await fetch('/api/generate-production', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: id,
            image: imageData,
            style: style
          }),
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error en la generación');
        }

        const results = await response.json();

        // Los stickers ya están guardados en disco temporal por el API
        // Solo almacenar metadata en localStorage para navegación
        const stickers = results.results?.stickers || [];

        console.log(`Generated ${stickers.length} stickers, saved to temporary disk storage`);

        // Almacenar metadata en localStorage
        localStorage.setItem(`sticker_metadata_${id}`, JSON.stringify({
          sessionId: id,
          style: style,
          timestamp: Date.now(),
          hasResults: true
        }));

        setProgress({ current: 6, total: 6, status: 'completed', message: '¡Completado!' });
        setIsComplete(true);

        setTimeout(() => {
          router.push(`/result/${id}?style=${style}`);
        }, 1500);

      } catch (error) {
        console.error('Error during generation:', error);
        setIsError(true);
        setErrorMessage(error.message || 'Error inesperado durante la generación');
      }
    };

    startGeneration();
  }, [id, style, router]);

  const getStyleDisplay = (styleId) => {
    const styles = {
      cartoon: { name: 'Cartoon', emoji: '🎨' },
      anime: { name: 'Anime', emoji: '✨' },
      realistic: { name: 'Realista', emoji: '📸' },
      watercolor: { name: 'Acuarela', emoji: '🎭' },
      pixel: { name: 'Pixel Art', emoji: '🎮' },
      minimalist: { name: 'Minimalista', emoji: '⚪' }
    };
    return styles[styleId] || { name: 'Desconocido', emoji: '❓' };
  };

  const styleInfo = getStyleDisplay(style);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {isError ? (
            <>
              {/* Error state */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className="mb-8"
              >
                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Error en la generación
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {errorMessage}
                </p>
                <Button
                  onClick={() => router.push('/create')}
                  variant="outline"
                >
                  Intentar de nuevo
                </Button>
              </motion.div>
            </>
          ) : !isComplete ? (
            <>
              {/* Loading animation */}
              <div className="mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 mx-auto mb-6"
                >
                  <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl">
                    <Sparkles className="w-12 h-12" />
                  </div>
                </motion.div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Generando tus stickers
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                  Estilo seleccionado: {styleInfo.emoji} {styleInfo.name}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {progress.message}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Progreso: {progress.current} de {progress.total} stickers emocionales
                </p>
                {progress.currentPose && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Creando pose: {progress.currentPose}
                  </p>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-8">
                <motion.div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Emotional poses info */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Poses emocionales: 😴 Durmiendo • 😢 Triste • 😊 Feliz • 💻 Trabajando • 🛏️ Con Almohada • 🍽️ Hambriento</p>
              </div>
            </>
          ) : (
            <>
              {/* Success animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className="mb-8"
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  ¡Stickers generados!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Tus stickers están listos. Redirigiendo...
                </p>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}