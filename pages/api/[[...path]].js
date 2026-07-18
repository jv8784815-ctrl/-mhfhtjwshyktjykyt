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
    console.log(`[PROXY] Backend URL: ${cachedUrl}`);
    return cachedUrl;
  } catch (e) {
    console.error('Error Gist:', e.message);
    return cachedUrl || null;
  }
}

export default async function handler(req, res) {
  console.log("✅ PROXY EJECUTÁNDOSE | Query:", JSON.stringify(req.query));

  const backend = await getBackend();
  if (!backend) return res.status(503).json({ error: 'Backend no disponible' });

  // Obtener segmentos de ruta (manejar tanto path como nxtPpath)
  let segments = req.query.path || req.query.nxtPpath || [];
  if (!Array.isArray(segments)) segments = [segments];
  
  // Eliminar 'api' si es el primer segmento
  if (segments.length > 0 && segments[0] === 'api') {
    segments = segments.slice(1);
  }
  
  const cleanPath = segments.join('/');
  const targetUrl = `${backend}/${cleanPath}`;
  
  console.log(` Forwarding to: ${targetUrl}`);

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
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error(` No-JSON (${response.status}): ${text.substring(0, 200)}`);
      return res.status(response.status).json({ 
        error: 'Respuesta inesperada', 
        detail: text.substring(0, 300) 
      });
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Error interno del proxy' });
  }
}
