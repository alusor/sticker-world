import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Eye, Calendar, Hash, Sparkles, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function GalleryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentSessions();
  }, []);

  const fetchRecentSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery/recent');

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStyleDisplay = (styleId) => {
    const styles = {
      cartoon: { name: 'Cartoon', emoji: '🎨', color: 'bg-blue-500' },
      anime: { name: 'Anime', emoji: '✨', color: 'bg-purple-500' },
      realistic: { name: 'Realista', emoji: '📸', color: 'bg-green-500' },
      watercolor: { name: 'Acuarela', emoji: '🎭', color: 'bg-pink-500' },
      pixel: { name: 'Pixel Art', emoji: '🎮', color: 'bg-orange-500' },
      minimalist: { name: 'Minimalista', emoji: '⚪', color: 'bg-gray-500' },
      pusheen: { name: 'Pusheen', emoji: '🐱', color: 'bg-indigo-500' }
    };
    return styles[styleId] || { name: 'Desconocido', emoji: '❓', color: 'bg-gray-400' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  const viewSession = (sessionId) => {
    router.push(`/result/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12"
        >
          <Sparkles className="w-full h-full text-blue-600" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error al cargar la galería
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={fetchRecentSessions} variant="outline">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🎨 Galería de Stickers
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Descubre los últimos stickers creados por la comunidad
          </p>
          <Button
            onClick={() => router.push('/create')}
            className="mr-4"
          >
            Crear mis stickers
          </Button>
          <Button
            onClick={fetchRecentSessions}
            variant="outline"
          >
            Actualizar galería
          </Button>
        </motion.div>

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay stickers aún
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              ¡Sé el primero en crear stickers increíbles!
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {sessions.map((session, index) => {
              const styleInfo = getStyleDisplay(session.style);

              return (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Style Header */}
                  <div className={`${styleInfo.color} p-4`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{styleInfo.emoji}</span>
                        <span className="font-semibold">{styleInfo.name}</span>
                      </div>
                      <div className="text-xs opacity-90">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(session.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Hash className="w-4 h-4" />
                        <span className="font-mono text-xs">
                          {session.sessionId.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <span className="text-green-600 font-semibold">
                          {session.successfulStickers}
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">
                          {session.totalStickers}
                        </span>
                      </div>
                    </div>

                    {/* Preview placeholder */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-32 mb-4 flex items-center justify-center">
                      {session.hasPreviewData ? (
                        <div className="text-center">
                          <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-xs text-gray-500">
                            {session.successfulStickers} stickers
                          </span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-xs text-gray-500">
                            Sin preview
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <Button
                      onClick={() => viewSession(session.sessionId)}
                      variant="outline"
                      className="w-full group-hover:bg-blue-50 group-hover:border-blue-300 dark:group-hover:bg-blue-900/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Stickers
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 text-gray-500 dark:text-gray-400"
        >
          <p className="text-sm">
            Las sesiones se almacenan temporalmente y se eliminan automáticamente después de 1 hora
          </p>
        </motion.div>
      </div>
    </div>
  );
}