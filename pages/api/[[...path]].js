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

  let segments = req.query.path || [];
  if (!Array.isArray(segments)) segments = [segments];
  if (segments.length > 0 && segments[0] === 'api') segments = segments.slice(1);
  
  const cleanPath = segments.join('/');
  const baseUrl = `${backend}/api/${cleanPath}`;
  const queryParams = new URLSearchParams(req.query).toString();
  const targetUrl = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;

  // 🎬 STREAMING DIRECTO PARA VIDEOS (Sin redirección)
  if (cleanPath.startsWith('anime/video')) {
    console.log(`🎬 Proxying video: ${targetUrl}`);
    
    try {
      // Pedimos solo el rango solicitado por el reproductor
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': req.headers['range'] || 'bytes=0-', 
          'Accept': '*/*',
        },
      });

      // Si Cloudflare devuelve error, lo reportamos como JSON
      if (!response.ok && response.status !== 206) {
        const errText = await response.text();
        return res.status(response.status).json({ error: 'Error upstream', detail: errText.substring(0, 200) });
      }

      // Reenviar headers EXACTOS del video (incluyendo Content-Range)
      const headersToSend = {};
      ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag'].forEach(h => {
        const val = response.headers.get(h);
        if (val) headersToSend[h] = val;
      });

      // IMPORTANTE: No enviar X-Frame-Options ni CSP que bloqueen iframes
      // (En este caso no aplican porque es streaming directo, pero por seguridad)
      
      res.writeHead(response.status, headersToSend);
      
      // Stream eficiente chunk por chunk
      const stream = response.body;
      if (stream) {
        for await (const chunk of stream) {
          res.write(chunk);
        }
      }
      return res.end();
      
    } catch (err) {
      console.error('❌ Video Proxy Error:', err.message);
      return res.status(500).json({ error: 'Error transmitiendo video' });
    }
  }

  // 🔍 PROXY NORMAL PARA JSON/BÚSQUEDAS
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
