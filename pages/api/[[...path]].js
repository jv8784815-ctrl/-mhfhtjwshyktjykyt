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

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': '*/*', // ← Importante para videos
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

    //  SI ES VIDEO: Reenviar los bytes directamente sin parsear
    if (contentType.includes('video/') || contentType.includes('octet-stream')) {
      console.log(`🎬 Streaming video: ${targetUrl}`);
      
      // Copiar headers importantes del video
      const videoHeaders = {};
      ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'].forEach(h => {
        const val = response.headers.get(h);
        if (val) videoHeaders[h] = val;
      });

      res.writeHead(response.status, videoHeaders);
      
      // Pipe directo del stream (eficiente para videos grandes)
      const stream = response.body;
      if (stream) {
        for await (const chunk of stream) {
          res.write(chunk);
        }
      }
      return res.end();
    }

    // 📄 SI ES JSON: Parsear normalmente (búsquedas, estados, etc.)
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // ⚠️ OTRO TIPO DE RESPUESTA (HTML de error, etc.)
    const text = await response.text();
    console.error(`⚠️ Respuesta no esperada (${response.status}): ${text.substring(0, 200)}`);
    return res.status(response.status).json({ 
      error: 'Respuesta inesperada del servidor',
      detail: text.substring(0, 300) 
    });

  } catch (err) {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Error interno del proxy' });
  }
}
