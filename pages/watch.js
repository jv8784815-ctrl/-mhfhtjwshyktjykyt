// pages/watch.js
import Head from 'next/head';

export default function WatchPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0d0509', 
      color: 'white', 
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Head>
        <title>FrikiBot - Reproductor Teto</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* HEADER ROSA ESTILO TETO */}
      <header style={{
        background: 'linear-gradient(90deg, #1a0b12 0%, #2a0f1a 100%)',
        padding: '1rem 2rem',
        borderBottom: '2px solid #ff0055',
        boxShadow: '0 0 15px rgba(255, 0, 85, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <h1 style={{ 
          margin: 0, 
          color: '#ff0055', 
          textShadow: '0 0 10px #ff0055',
          fontSize: '1.5rem',
          letterSpacing: '2px',
          fontFamily: 'monospace' // Fallback si Orbitron no carga
        }}>
          FRIKIBOT 🍞
        </h1>
      </header>

      {/* ÁREA DEL VIDEO */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* CONTENEDOR DEL VIDEO CON BORDE ROSA */}
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(255, 0, 85, 0.2)',
          border: '1px solid #ff6699',
          marginBottom: '1.5rem'
        }}>
          <video 
            id="player" 
            controls 
            autoPlay 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          >
            <source src="" type="video/mp4" />
          </video>
        </div>

        {/* INFORMACIÓN DEL EPISODIO */}
        <div style={{ paddingLeft: '1rem', borderLeft: '4px solid #ff0055' }}>
          <h2 id="title" style={{ margin: '0 0 0.5rem 0', color: '#ff6699', fontFamily: 'monospace' }}>
            Cargando...
          </h2>
          <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
            Reproduciendo desde FrikiBot Server 🍞
          </p>
        </div>

      </main>

      {/* SCRIPT PARA CARGAR EL VIDEO DINÁMICAMENTE */}
      <script dangerouslySetInnerHTML={{__html: `
        document.addEventListener('DOMContentLoaded', () => {
          const params = new URLSearchParams(window.location.search);
          const videoId = params.get('id');
          const title = params.get('title') || 'Episodio sin título';
          
          const player = document.getElementById('player');
          const titleLabel = document.getElementById('title');
          
          if (videoId) {
            // Usa la misma URL base donde estás viendo la página
            const baseUrl = window.location.origin;
            player.src = \`\${baseUrl}/api/anime/video/\${videoId}\`;
            titleLabel.innerText = title;
          } else {
            titleLabel.innerText = "⚠️ No se especificó ID de video";
            titleLabel.style.color = "#ff0055";
          }
        });
      `}} />
    </div>
  );
}
