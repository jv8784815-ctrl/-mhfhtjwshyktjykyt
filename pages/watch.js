// pages/watch.js
import Head from 'next/head';

export default function WatchPage() {
  return (
    <>
      <Head>
        <title>FrikiBot - Reproductor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Fuente estilo anime/cyber */}
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Quicksand:wght@400;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="teto-container">
        {/* Header estilo FrikiBot */}
        <header className="teto-header">
          <div className="logo">
            <span className="icon"></span> 
            <h1>FRIKIBOT</h1>
          </div>
          <div className="search-bar">
            <input type="text" placeholder="Buscar anime..." id="searchInput" />
            <button onClick={() => window.location.href = `/api/anime/search?q=${document.getElementById('searchInput').value}`}>🔍</button>
          </div>
        </header>

        {/* Área Principal del Video */}
        <main className="player-area">
          <div className="video-wrapper">
            {/* El ID del video se pasa por URL ?id=733c40dd */}
            <video 
              id="animePlayer" 
              controls 
              autoPlay 
              poster="https://i.pinimg.com/736x/8d/f3/52/8df3529630143375b93922565283a437.jpg" // Placeholder Kasane Teto
              className="teto-player"
            >
              <source src="" type="video/mp4" />
              Tu navegador no soporta video HTML5.
            </video>
          </div>

          <div className="video-info">
            <h2 id="videoTitle">Cargando episodio...</h2>
            <p className="status">Reproduciendo desde FrikiBot Server 🍞</p>
          </div>
        </main>
      </div>

      <style jsx global>{`
        :root {
          --teto-pink: #ff0055;
          --teto-dark: #1a0b12;
          --teto-black: #0d0509;
          --teto-accent: #ff6699;
          --text-main: #ffffff;
        }

        body {
          margin: 0;
          background-color: var(--teto-black);
          color: var(--text-main);
          font-family: 'Quicksand', sans-serif;
        }

        .teto-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* HEADER */
        .teto-header {
          background: linear-gradient(90deg, var(--teto-dark) 0%, #2a0f1a 100%);
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid var(--teto-pink);
          box-shadow: 0 0 15px rgba(255, 0, 85, 0.3);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo h1 {
          font-family: 'Orbitron', sans-serif;
          margin: 0;
          color: var(--teto-pink);
          text-shadow: 0 0 10px var(--teto-pink);
          font-size: 1.5rem;
          letter-spacing: 2px;
        }

        .search-bar {
          display: flex;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--teto-accent);
        }

        .search-bar input {
          background: transparent;
          border: none;
          padding: 8px 15px;
          color: white;
          outline: none;
          width: 200px;
        }

        .search-bar button {
          background: var(--teto-pink);
          border: none;
          padding: 0 15px;
          cursor: pointer;
          color: white;
        }

        /* PLAYER AREA */
        .player-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .video-wrapper {
          width: 100%;
          aspect-ratio: 16/9;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 30px rgba(255, 0, 85, 0.2);
          border: 1px solid var(--teto-accent);
          position: relative;
        }

        .teto-player {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .video-info {
          width: 100%;
          margin-top: 1.5rem;
          padding-left: 1rem;
          border-left: 4px solid var(--teto-pink);
        }

        .video-info h2 {
          margin: 0 0 0.5rem 0;
          font-family: 'Orbitron', sans-serif;
          color: var(--teto-accent);
        }

        .status {
          color: #888;
          font-size: 0.9rem;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .teto-header { flex-direction: column; gap: 1rem; }
          .search-bar { width: 100%; }
          .search-bar input { width: 100%; }
        }
      `}</style>

      <script dangerouslySetInnerHTML={{__html: `
        document.addEventListener('DOMContentLoaded', () => {
          const params = new URLSearchParams(window.location.search);
          const videoId = params.get('id');
          const title = params.get('title') || 'Episodio sin título';
          
          const player = document.getElementById('animePlayer');
          const titleLabel = document.getElementById('videoTitle');
          
          if (videoId) {
            // Construye la URL usando TU proxy de Vercel actual
            const currentHost = window.location.origin;
            const videoUrl = \`\${currentHost}/api/anime/video/\${videoId}\`;
            
            player.src = videoUrl;
            titleLabel.innerText = title;
            
            console.log('FrikiBot Player iniciado:', videoUrl);
          } else {
            titleLabel.innerText = "No se especificó ningún video";
            titleLabel.style.color = "#ff0055";
          }
        });
      `}} />
    </>
  );
}
