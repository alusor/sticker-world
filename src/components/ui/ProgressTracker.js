import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Zap, Users } from 'lucide-react';

const ProgressTracker = ({
  mode = 'sequential',
  progress = {},
  variations = [],
  isActive = false
}) => {
  const { current = 0, total = 6, currentVariation = '', status = 'waiting' } = progress;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'generating':
        return <Clock className="w-4 h-4 animate-pulse text-blue-500" />;
      case 'starting_parallel':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'generating':
        return `Generando: ${currentVariation}`;
      case 'starting_parallel':
        return 'Iniciando generación paralela...';
      case 'completed':
        return '¡Generación completada!';
      default:
        return 'Esperando inicio...';
    }
  };

  const progressPercentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full space-y-4">
      {/* Header con modo y estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            mode === 'parallel'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {mode === 'parallel' ? '⚡ Paralelo' : '🔄 Secuencial'}
          </span>
          {isActive && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              {getStatusIcon(status)}
              <span>{getStatusText(status)}</span>
            </div>
          )}
        </div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {current}/{total} stickers
        </div>
      </div>

      {/* Barra de progreso principal */}
      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            className={`h-3 rounded-full ${
              mode === 'parallel'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                : 'bg-gradient-to-r from-blue-400 to-blue-600'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white mix-blend-difference">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {/* Lista de variaciones */}
      <AnimatePresence>
        {isActive && variations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
          >
            {variations.map((variation, index) => {
              const isCompleted = index < current;
              const isCurrent = index === current - 1 && status === 'generating';
              const isPending = index >= current;

              return (
                <motion.div
                  key={variation.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border text-sm ${
                    isCompleted
                      ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                      : isCurrent
                      ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200 animate-pulse'
                      : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isCompleted
                        ? 'bg-green-500'
                        : isCurrent
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                    {variation.emoji && (
                      <span className="text-sm">{variation.emoji}</span>
                    )}
                    <span className="font-medium text-xs">{variation.name}</span>
                  </div>
                  {mode === 'sequential' && (
                    <div className="mt-1 text-xs opacity-75">
                      {isCompleted ? '✅ Completado' : isCurrent ? '🔄 Generando...' : '⏳ Pendiente'}
                    </div>
                  )}
                  {mode === 'parallel' && status !== 'waiting' && status !== 'starting_parallel' && (
                    <div className="mt-1 text-xs opacity-75">
                      {isCompleted ? '✅ Completado' : '🔄 En proceso...'}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Información adicional para modo paralelo */}
      {mode === 'parallel' && isActive && status === 'starting_parallel' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">
              Generando 6 stickers simultáneamente...
            </span>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            El tiempo total será determinado por el sticker que tarde más
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressTracker;