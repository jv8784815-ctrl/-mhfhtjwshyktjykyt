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

    const rawText = await res.text(); // Leer como texto plano
    let data;
    try {
      data = JSON.parse(rawText); // Intentar parsear
    } catch (parseErr) {
      console.error('[GIST] JSON inválido:', rawText);
      return cachedUrl || null;
    }

    // Validar que tenga la propiedad tunnel y sea una URL válida
    const tunnel = data?.tunnel;
    if (typeof tunnel !== 'string' || !tunnel.startsWith('https://')) {
      console.error('[GIST] URL inválida en Gist:', tunnel);
      return cachedUrl || null;
    }

    cachedUrl = tunnel.replace(/\/$/, ''); // Quitar slash final
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

  // Redirección 302 para videos
  if (cleanPath.startsWith('anime/video')) {
    console.log(`🎬 Redirecting video to: ${targetUrl}`);
    res.writeHead(302, { 
      Location: targetUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    });
    return res.end();
  }

  // Proxy para JSON
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

    const text = await response.text();
    return res.status(response.status).send(text);

  } catch (err) {
    console.error('❌ Proxy Error:', err.message);
    res.status(500).json({ error: 'Error interno del proxy' });
  }
}
