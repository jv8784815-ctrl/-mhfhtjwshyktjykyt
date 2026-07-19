// pages/api/[[...path]].js - PROXY DE STREAMING DIRECTO

const GIST_URL = 'https://gist.githubusercontent.com/jv8784815-ctrl/c520f9db26b1b30f2d58cd761921ed76/raw/anime-tunnel.json';
let cachedUrl = null;
let cacheTime = 0;

async function getBackend() {
  const now = Date.now();
  if (cachedUrl && now - cacheTime < 300000) return cachedUrl;
  
  try {
    const res = await fetch(GIST_URL);
    const data = await res.json();
    cachedUrl = data.tunnel?.replace(/\/$/, '');
    cacheTime = now;
    return cachedUrl;
  } catch (e) {
    console.error('Error Gist:', e.message);
    return cachedUrl || null;
  }
}

export default async function handler(req, res) {
  const backend = await getBackend();
  if (!backend) return res.status(503).json({ error: 'Servidor no disponible' });

  // Reconstruir ruta limpia
  let segments = req.query.path || [];
  if (!Array.isArray(segments)) segments = [segments];
  if (segments.length > 0 && segments[0] === 'api') segments = segments.slice(1);
  
  const cleanPath = segments.join('/');
  const baseUrl = `${backend}/api/${cleanPath}`;
  const queryParams = new URLSearchParams(req.query).toString();
  const targetUrl = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;

  // 🎬 MODO CRUNCHYROLL: STREAMING DIRECTO SIN REDIRECCIÓN
  if (cleanPath.startsWith('anime/video')) {
    console.log(`🎬 [PROXY] Iniciando stream: ${targetUrl}`);
    
    try {
      // Respetar el rango solicitado por el reproductor (seek/pausa)
      const rangeHeader = req.headers['range'] || 'bytes=0-';
      
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': rangeHeader,
          'Accept': '*/*',
          'Connection': 'keep-alive',
        },
      });

      // Si hay error upstream, devolverlo limpiamente
      if (!response.ok && response.status !== 206) {
        const errText = await response.text().catch(() => 'Error desconocido');
        console.error(`❌ Upstream error ${response.status}:`, errText.substring(0, 100));
        return res.status(response.status).json({ 
          error: 'Error en el servidor de video',
          detail: errText.substring(0, 200) 
        });
      }

      // Copiar SOLO los headers necesarios para streaming
      // NO copiamos X-Frame-Options ni CSP para evitar bloqueos
      const safeHeaders = {};
      ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified'].forEach(h => {
        const val = response.headers.get(h);
        if (val) safeHeaders[h] = val;
      });

      // Enviar respuesta con status correcto (200 o 206)
      res.writeHead(response.status, safeHeaders);
      
      // STREAMING CHUNKED: Transmite byte por byte sin cargar todo en memoria
      // Esto es lo que hace Crunchyroll/Netflix internamente
      const stream = response.body;
      if (stream) {
        const reader = stream.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Escribir chunk directamente al cliente
            res.write(value);
          }
        } catch (streamErr) {
          console.warn('⚠️ Stream interrumpido (posible seek del usuario):', streamErr.message);
        } finally {
          reader.releaseLock();
        }
      }
      
      return res.end();
      
    } catch (err) {
      console.error('❌ Error crítico en proxy de video:', err.message);
      // Solo enviar error si aún no se han enviado headers
      if (!res.writableEnded) {
        return res.status(500).json({ error: 'Error transmitiendo video' });
      }
    }
  }

  // 🔍 PROXY NORMAL PARA JSON/BÚSQUEDAS (Sin cambios)
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': `${backend}/`,
    'Origin': backend,
  };

  if (req.body) headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(targetUrl, { method: req.method, headers, body: req.body ? JSON.stringify(req.body) : undefined });
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }
    
    const text = await response.text();
    return res.status(response.status).send(text);

  } catch (err) {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
}
