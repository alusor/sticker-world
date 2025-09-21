import { motion } from 'framer-motion';
import { Clock, TrendingUp, Target, Download, BarChart3, Zap } from 'lucide-react';
import Button from './Button';
import Card from './Card';

const MetricsDisplay = ({ results, onExport }) => {
  if (!results) {
    return (
      <Card className="text-center p-8">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Las métricas aparecerán aquí después de la generación
        </p>
      </Card>
    );
  }

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value, total) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const successRate = formatPercentage(results.metrics.successful, results.metrics.successful + results.metrics.failed);

  const exportData = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      testResults: results,
      summary: {
        mode: results.mode,
        totalDuration: results.totalDuration,
        successRate: successRate,
        averageTime: results.metrics.averageTime,
        stickerCount: results.stickers.length
      }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sticker-generation-metrics-${results.mode}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onExport) onExport(dataToExport);
  };

  return (
    <div className="space-y-6">
      {/* Resumen principal */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Métricas de Generación
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              results.mode === 'parallel'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {results.mode === 'parallel' ? '⚡ Paralelo' : '🔄 Secuencial'}
            </span>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tiempo total */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatTime(results.totalDuration)}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Tiempo Total</p>
            </motion.div>

            {/* Tiempo promedio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatTime(results.metrics.averageTime)}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Promedio</p>
            </motion.div>

            {/* Tasa de éxito */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
            >
              <Target className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {successRate}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">Tasa de Éxito</p>
            </motion.div>

            {/* Stickers generados */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
            >
              <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {results.metrics.successful}
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">Exitosos</p>
            </motion.div>
          </div>
        </Card.Content>
      </Card>

      {/* Detalles de tiempos */}
      <Card>
        <Card.Header>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
            Detalles de Tiempos
          </h4>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Mínimo</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatTime(results.metrics.minTime)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Máximo</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatTime(results.metrics.maxTime)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Diferencia</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatTime(results.metrics.maxTime - results.metrics.minTime)}
              </p>
            </div>
          </div>

          {/* Gráfico de barras simple */}
          {results.metrics.individualTimes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tiempo por Sticker:
              </p>
              {results.stickers.map((sticker, index) => {
                if (!sticker.generationTime) return null;

                const maxTime = Math.max(...results.metrics.individualTimes);
                const percentage = (sticker.generationTime / maxTime) * 100;

                return (
                  <div key={sticker.id} className="flex items-center space-x-3">
                    <div className="w-20 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {sticker.name}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      />
                    </div>
                    <div className="w-16 text-xs text-gray-600 dark:text-gray-400 text-right">
                      {formatTime(sticker.generationTime)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Información adicional */}
      <Card>
        <Card.Header>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
            Información del Test
          </h4>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Modo de Generación:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {results.mode === 'parallel' ? 'Paralelo (Simultáneo)' : 'Secuencial (Uno por vez)'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Inicio del Test:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(results.startTime).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Stickers Exitosos:</p>
              <p className="font-medium text-green-600 dark:text-green-400">
                {results.metrics.successful}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Stickers Fallidos:</p>
              <p className="font-medium text-red-600 dark:text-red-400">
                {results.metrics.failed}
              </p>
            </div>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Métricas JSON
          </Button>
        </Card.Footer>
      </Card>

      {/* Recomendaciones para animaciones */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <Card.Header>
          <h4 className="text-md font-semibold text-blue-900 dark:text-blue-100">
            💡 Recomendaciones para Animaciones
          </h4>
        </Card.Header>
        <Card.Content>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>Duración de loading:</strong> {formatTime(results.metrics.averageTime * 1.2)}
              <span className="text-blue-600 dark:text-blue-300"> (20% buffer)</span>
            </p>
            <p>
              <strong>Intervalo de steps:</strong> {formatTime(Math.floor(results.metrics.averageTime / 5))}
              <span className="text-blue-600 dark:text-blue-300"> (5 pasos por sticker)</span>
            </p>
            <p>
              <strong>Tiempo mínimo garantizado:</strong> {formatTime(results.metrics.minTime)}
              <span className="text-blue-600 dark:text-blue-300"> (escenario optimista)</span>
            </p>
            {results.mode === 'parallel' && (
              <p>
                <strong>Para lotes paralelos:</strong> Usar tiempo máximo ({formatTime(results.metrics.maxTime)})
                <span className="text-blue-600 dark:text-blue-300"> como referencia</span>
              </p>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default MetricsDisplay;