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

  const path = req.query.path ? req.query.path.join('/') : '';
  const targetUrl = `${backend}/${path}`;

  // Headers que simulan un navegador Chrome real
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': `${backend}/`,
    'Origin': backend,
    'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Microsoft Edge";v="126"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
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
    
    // Si Cloudflare devuelve HTML en vez de JSON, detectar y reportar
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`[PROXY] Respuesta no-JSON recibida (${response.status}): ${text.substring(0, 200)}`);
      
      if (text.includes('challenge-platform') || text.includes('verifying') || text.includes('cloudflare')) {
        return res.status(502).json({ 
          error: 'Cloudflare bloqueó la petición. Intenta nuevamente en unos segundos.' 
        });
      }
      
      return res.status(response.status).json({ 
        error: 'El servidor devolvió una respuesta inesperada',
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
