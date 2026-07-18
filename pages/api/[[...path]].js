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

  // Reconstruir ruta eliminando la primera parte 'api' si existe
  let pathSegments = req.query.path || [];
  if (Array.isArray(pathSegments) && pathSegments[0] === 'api') {
    pathSegments = pathSegments.slice(1);
  }
  
  const path = pathSegments.join('/');
  const targetUrl = `${backend}/${path}`;
  
  console.log(`[PROXY] Forwarding: ${req.method} ${targetUrl}`); // Log para depurar

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
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
      console.error(`[PROXY] No-JSON (${response.status}): ${text.substring(0, 200)}`);
      return res.status(response.status).json({ 
        error: 'Respuesta inesperada del servidor',
        detail: text.substring(0, 300)
      });
    }

    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (err) {
    console.error('[PROXY] Error:', err.message);
    res.status(500).json({ error: 'Error interno del proxy' });
  }
}
