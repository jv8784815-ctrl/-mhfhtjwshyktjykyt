// pages/api/watch.js

export default function handler(req, res) {
  const { id, title } = req.query;
  
  // Si no hay ID, redirigir a búsqueda o mostrar error
  if (!id) {
    return res.status(400).send(`
      <html>
        <body style="background:#0d0509;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
          <h1 style="color:#ff0055;text-shadow:0 0 10px #ff0055;">⚠️ FRIKIBOT: No se especificó video</h1>
        </body>
      </html>
    `);
  }

  // Devolver HTML completo con estilo Kasane Teto
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FrikiBot - ${title || 'Reproductor'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          background: #0d0509; 
          color: white; 
          font-family: 'Segoe UI', sans-serif;
          min-height: 100vh;
        }
        header {
          background: linear-gradient(90deg, #1a0b12, #2a0f1a);
          padding: 1rem 2rem;
          border-bottom: 2px solid #ff0055;
          box-shadow: 0 0 15px rgba(255,0,85,0.3);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        h1 {
          color: #ff0055;
          text-shadow: 0 0 10px #ff0055;
          font-size: 1.5rem;
          letter-spacing: 2px;
          font-family: monospace;
        }
        main {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 2rem;
        }
        .video-container {
          width: 100%;
          aspect-ratio: 16/9;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #ff6699;
          box-shadow: 0 0 30px rgba(255,0,85,0.2);
          margin-bottom: 1.5rem;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .info {
          padding-left: 1rem;
          border-left: 4px solid #ff0055;
        }
        .info h2 {
          color: #ff6699;
          margin-bottom: 0.5rem;
          font-family: monospace;
        }
        .info p {
          color: #888;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>FRIKIBOT 🍞</h1>
      </header>
      <main>
        <div class="video-container">
          <video id="player" controls autoplay>
            <source src="/api/anime/video/${id}" type="video/mp4">
          </video>
        </div>
        <div class="info">
          <h2>${title || 'Episodio sin título'}</h2>
          <p>Reproduciendo desde FrikiBot Server 🍞</p>
        </div>
      </main>
      <script>
        // Asegurar que el video use la URL correcta del proxy
        document.addEventListener('DOMContentLoaded', () => {
          const player = document.getElementById('player');
          player.src = '/api/anime/video/${id}';
        });
      </script>
    </body>
    </html>
  `);
}
