// pages/api/[[...path]].js

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

  // Reconstruir ruta
  let segments = req.query.path || [];
  if (!Array.isArray(segments)) segments = [segments];
  if (segments.length > 0 && segments[0] === 'api') segments = segments.slice(1);
  
  const cleanPath = segments.join('/');
  const baseUrl = `${backend}/api/${cleanPath}`;
  const queryParams = new URLSearchParams(req.query).toString();
  const targetUrl = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;

  // 🎬 PARA VIDEOS: STREAMING DIRECTO SIN REDIRECCIÓN
  // Esto evita que el navegador cambie la URL a trycloudflare.com
  if (cleanPath.startsWith('anime/video')) {
    console.log(`🎬 Streaming video: ${targetUrl}`);
    
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Range': req.headers['range'] || '', // Permite seek/pausa
          'Accept': '*/*',
        },
      });

      // Reenviar headers críticos del video al navegador
      const videoHeaders = {};
      ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'].forEach(h => {
        const val = response.headers.get(h);
        if (val) videoHeaders[h] = val;
      });

      res.writeHead(response.status, videoHeaders);
      
      // Pipear bytes directamente (sin cargar todo en memoria)
      const stream = response.body;
      if (stream) {
        for await (const chunk of stream) {
          res.write(chunk);
        }
      }
      return res.end();
      
    } catch (err) {
      console.error('❌ Error streaming video:', err.message);
      return res.status(500).json({ error: 'Error al transmitir video' });
    }
  }

  // 🔍 PARA BÚSQUEDAS/DATOS JSON: Proxy normal
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': `${backend}/`,
    'Origin': backend,
  };

  if (req.body) headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Fallback seguro para otros tipos
    const text = await response.text();
    return res.status(response.status).send(text);

  } catch (err) {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Error interno del proxy' });
  }
}
