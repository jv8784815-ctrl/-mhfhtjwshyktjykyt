// pages/video/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function VideoPage() {
  const router = useRouter();
  const { id } = router.query; // Obtiene el ID de la URL /video/733c40dd
  const [title, setTitle] = useState('Cargando...');

  // Leer título de los parámetros si existe (?title=Naruto)
  useEffect(() => {
    if (router.isReady) {
      const params = new URLSearchParams(window.location.search);
      setTitle(params.get('title') || `Episodio ${id}`);
    }
  }, [router.isReady, id]);

  // Si aún no tenemos el ID, mostrar carga
  if (!id) return <div style={{ background: '#0d0509', height: '100vh' }} />;

  // RUTA RELATIVA: El iframe pedirá el video a Vercel, 
  // pero la URL principal NUNCA cambiará.
  const videoSrc = `/api/anime/video/${id}`;

  return (
    <div style={{ 
      minHeight: '100vh', backgroundColor: '#0d0509', color: 'white', 
      fontFamily: "'Segoe UI', sans-serif", margin: 0, padding: 0,
      display: 'flex', flexDirection: 'column'
    }}>
      
      {/* HEADER FIJO ESTILO TETO */}
      <header style={{
        background: 'linear-gradient(90deg, #1a0b12, #2a0f1a)',
        padding: '1rem 2rem', borderBottom: '2px solid #ff0055',
        boxShadow: '0 0 15px rgba(255,0,85,0.3)', zIndex: 10, position: 'sticky', top: 0
      }}>
        <h1 style={{ margin: 0, color: '#ff0055', textShadow: '0 0 10px #ff0055', fontSize: '1.5rem', fontFamily: 'monospace' }}>
          FRIKIBOT 
        </h1>
      </header>

      {/* REPRODUCTOR EN IFRAME (Mantiene la URL fija) */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={{
          width: '100%', aspectRatio: '16/9', background: '#000',
          borderRadius: '12px', overflow: 'hidden',
          border: '1px solid #ff6699',
          boxShadow: '0 0 30px rgba(255, 0, 85, 0.2)',
          marginBottom: '1.5rem'
        }}>
          <iframe 
            src={videoSrc} 
            title="Reproductor FrikiBot"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>

        <div style={{ paddingLeft: '1rem', borderLeft: '4px solid #ff0055' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#ff6699', fontFamily: 'monospace' }}>
            {title}
          </h2>
          <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
            Reproduciendo desde FrikiBot Server | URL Segura
          </p>
        </div>

      </main>
    </div>
  );
}
