// pages/video/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function VideoPage() {
  const router = useRouter();
  const { id } = router.query;
  const [title, setTitle] = useState('Cargando...');
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    if (router.isReady && id) {
      // Leer título de los parámetros
      const params = new URLSearchParams(window.location.search);
      setTitle(params.get('title') || `Episodio ${id}`);
      
      // Construir URL del proxy. 
      // El proxy hará la redirección 302, pero como está en un iframe,
      // la URL principal NUNCA cambiará.
      setIframeSrc(`/api/anime/video/${id}`);
    }
  }, [router.isReady, id]);

  if (!id) return null;

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

      {/* REPRODUCTOR EN IFRAME AISLADO */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={{
          width: '100%', aspectRatio: '16/9', background: '#000',
          borderRadius: '12px', overflow: 'hidden',
          border: '1px solid #ff6699',
          boxShadow: '0 0 30px rgba(255, 0, 85, 0.2)',
          marginBottom: '1.5rem'
        }}>
          {iframeSrc ? (
            <iframe 
              src={iframeSrc} 
              title="Reproductor FrikiBot"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ff0055' }}>
              Cargando stream...
            </div>
          )}
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
