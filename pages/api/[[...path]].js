// pages/api/[[...path]].js

const GIST_URL = 'https://gist.githubusercontent.com/jv8784815-ctrl/c520f9db26b1b30f2d58cd761921ed76/raw/anime-tunnel.json';
let cachedUrl = null;
let cacheTime = 0;

async function getBackend() {
  const now = Date.now();
  if (cachedUrl && now - cacheTime < 300000) return cachedUrl; // 5 minutos
  
  try {
    const res = await fetch(`${GIST_URL}?t=${now}`);
    
    if (!res.ok) {
      console.error(`[GIST] Error HTTP: ${res.status}`);
      return cachedUrl || null;
    }

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[GIST] JSON inválido:', rawText);
      return cachedUrl || null;
    }

    const tunnel = data?.tunnel;
    if (typeof tunnel !== 'string' || !tunnel.startsWith('https://')) {
      console.error('[GIST] URL inválida en Gist:', tunnel);
      return cachedUrl || null;
    }

    cachedUrl = tunnel.replace(/\/$/, '');
    cacheTime = now;
    console.log(`[PROXY] Backend actualizado: ${cachedUrl}`);
    return cachedUrl;
  } catch (e) {
    console.error('[GIST] Error general:', e.message);
    return cachedUrl || null;
  }
}

export default async function handler(req, res) {
  const backend = await getBackend();
  if (!backend) {
    console.error('[PROXY] No se pudo obtener backend');
    return res.status(503).json({ error: 'Servidor no disponible o URL inválida' });
  }

  // Reconstruir ruta
  let segments = req.query.path || [];
  if (!Array.isArray(segments)) segments = [segments];
  if (segments.length > 0 && segments[0] === 'api') segments = segments.slice(1);
  
  const cleanPath = segments.join('/');
  const baseUrl = `${backend}/api/${cleanPath}`;
  const queryParams = new URLSearchParams(req.query).toString();
  const targetUrl = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;

  // MANEJO DE VIDEOS: STREAMING DIRECTO
  if (cleanPath.startsWith('anime/video')) {
    console.log(`🎬 [STREAM] Proxying video: ${targetUrl}`);
    
    try {
      // Reenviar headers importantes como Range para seek
      const rangeHeader = req.headers['range'];
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': rangeHeader || '',
          'Accept': '*/*',
          'Connection': 'keep-alive',
        },
      });

      // Si el backend devuelve error, propagarlo
      if (!response.ok) {
        console.error(`❌ [UPSTREAM] ${response.status} ${targetUrl}`);
        return res.status(response.status).send('Error upstream');
      }

      // Copiar headers del video (sin headers de seguridad que bloqueen iframes)
      const headersToSend = {};
      ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified'].forEach(h => {
        const val = response.headers.get(h);
        if (val) headersToSend[h] = val;
      });

      res.writeHead(response.status, headersToSend);
      
      // Streaming chunked
      const stream = response.body;
      if (stream) {
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } catch (streamErr) {
          console.warn('⚠️ [STREAM] Interrupción:', streamErr.message);
        } finally {
          reader.releaseLock();
        }
      }
      return res.end();

    } catch (err) {
      console.error('❌ [STREAM] Error:', err.message);
      if (!res.writableEnded) {
        return res.status(500).send('Error en el stream');
      }
    }
  }

  // PARA JSON: Proxy normal
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
    console.error('❌ [JSON] Proxy Error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
}
