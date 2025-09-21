# Troubleshooting MongoDB en Vercel

## Errores Comunes y Soluciones

### 1. Error: "Cannot read properties of null (reading 'find')"

**Causa:** La conexión a MongoDB no se establece correctamente.

**Soluciones:**
- Verificar que las variables de entorno estén configuradas en Vercel
- Comprobar que el string de conexión MongoDB Atlas sea correcto
- Verificar que la IP de Vercel esté en la whitelist de MongoDB Atlas

### 2. Variables de Entorno en Vercel

Asegurar que estén configuradas:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=sticker-world
GEMINI_API_KEY=tu_api_key_aqui
```

### 3. Configuración MongoDB Atlas

1. **Network Access**: Agregar `0.0.0.0/0` para permitir todas las IPs (Vercel usa IPs dinámicas)
2. **Database Access**: Crear usuario con permisos de lectura/escritura
3. **Connection String**: Usar el formato SRV con las credenciales correctas

### 4. Timeouts en Vercel

Las funciones serverless tienen límites de tiempo:
- **Hobby Plan**: 10 segundos
- **Pro Plan**: 60 segundos

### 5. Debugging

#### Health Check Endpoint
```
GET /api/health
```

#### Logs útiles
- Console logs están disponibles en Vercel Functions
- Usar `console.error` para errores críticos
- Incluir timestamps en logs importantes

#### Variables de entorno para debugging
```
NODE_ENV=development  # Para logs detallados
```

### 6. Optimizaciones Implementadas

1. **Connection Pooling**: Reutilizar conexiones MongoDB
2. **Projection**: Excluir campos base64 grandes en queries de galería
3. **Cache Headers**: Implementado cache de 60s para la galería
4. **Error Handling**: Manejo específico por tipo de error
5. **Timeouts**: Timeouts de conexión optimizados para serverless

### 7. Monitoreo

#### Endpoints para diagnóstico:
- `/api/health` - Estado de MongoDB y variables de entorno
- `/api/gallery/recent` - Test de consultas con projection

#### Métricas importantes:
- Tiempo de respuesta de conexión MongoDB
- Número de documentos en collection
- Errores de timeout vs errores de configuración

### 8. Fallbacks Implementados

1. **Cache en sessionStorage**: La galería cachea resultados por 1 minuto
2. **Timeout handling**: 10 segundos timeout en frontend
3. **Error messages específicos**: Diferentes mensajes según el tipo de error
4. **Graceful degradation**: La app funciona aunque la galería falle

### 9. Comandos Útiles para Debugging

```bash
# Verificar variables en Vercel CLI
vercel env ls

# Ver logs en tiempo real
vercel logs

# Deploy con logs
vercel --debug
```

### 10. Checklist Pre-Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] MongoDB Atlas whitelist configurado (0.0.0.0/0)
- [ ] Usuario MongoDB con permisos correctos
- [ ] Connection string testeado localmente
- [ ] Health check endpoint funcional
- [ ] TTL index creado en collection