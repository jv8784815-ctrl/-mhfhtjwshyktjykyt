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
    console.error('Error leyendo Gist:', e.message);
    return cachedUrl || null;
  }
}

export default async function handler(req, res) {
  const backend = await getBackend();
  if (!backend) return res.status(503).json({ error: 'Servidor no disponible' });

  // Obtener segmentos de ruta
  let segments = req.query.path || [];
  if (!Array.isArray(segments)) segments = [segments];
  
  // Eliminar 'api' si está presente (Next.js lo incluye por defecto)
  if (segments.length > 0 && segments[0] === 'api') {
    segments = segments.slice(1);
  }
  
  // Construir ruta limpia
  const cleanPath = segments.join('/');
  const targetUrl = `${backend}/${cleanPath}`;
  
  console.log(`[PROXY] ${req.method} -> ${targetUrl}`);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': `${backend}/`,
    'Origin': backend,
  };

  if (req.body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`[PROXY] HTML recibido (${response.status}): ${text.substring(0, 150)}`);
      return res.status(response.status).json({ 
        error: 'El servidor devolvió HTML en lugar de JSON',
        detail: text.substring(0, 300)
      });
    }

    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (err) {
    console.error('[PROXY] Error de conexión:', err.message);
    res.status(500).json({ error: 'Error interno del proxy' });
  }
}
