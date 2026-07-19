// pages/watch.js
import { useEffect, useState } from 'react';

export default function WatchPage() {
  const [videoSrc, setVideoSrc] = useState('');
  const [title, setTitle] = useState('Cargando episodio...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const videoTitle = params.get('title') || 'Episodio sin título';
    
    if (id) {
      // ️ TRUCO CLAVE: Usar ruta RELATIVA. 
      // El navegador completará esto automáticamente con frikibot-anime.vercel.app
      // NUNCA aparecerá trycloudflare.com en la barra de direcciones.
      setVideoSrc(`/api/anime/video/${id}`);
      setTitle(videoTitle);
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0d0509', 
      color: 'white', 
      fontFamily: "'Segoe UI', sans-serif",
      margin: 0, padding: 0, display: 'flex', flexDirection: 'column'
    }}>
      
      {/* HEADER FIJO ESTILO KASANE TETO */}
      <header style={{
        background: 'linear-gradient(90deg, #1a0b12 0%, #2a0f1a 100%)',
        padding: '1rem 2rem',
        borderBottom: '2px solid #ff0055',
        boxShadow: '0 0 15px rgba(255, 0, 85, 0.3)',
        display: 'flex', alignItems: 'center', zIndex: 10, position: 'sticky', top: 0
      }}>
        <h1 style={{ 
          margin: 0, color: '#ff0055', 
          textShadow: '0 0 10px #ff0055',
          fontSize: '1.5rem', letterSpacing: '2px', fontFamily: 'monospace'
        }}>
          FRIKIBOT 🍞
        </h1>
      </header>

      {/* ÁREA DE REPRODUCCIÓN CON IFRAME */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Contenedor del Video con Marco Rosa */}
        <div style={{
          width: '100%', aspectRatio: '16/9', background: '#000',
          borderRadius: '12px', overflow: 'hidden',
          border: '1px solid #ff6699',
          boxShadow: '0 0 30px rgba(255, 0, 85, 0.2)',
          marginBottom: '1.5rem'
        }}>
          {videoSrc ? (
            <iframe 
              src={videoSrc} 
              title="Reproductor FrikiBot"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ff0055' }}>
              Cargando stream...
            </div>
          )}
        </div>

        {/* Información del Episodio */}
        <div style={{ paddingLeft: '1rem', borderLeft: '4px solid #ff0055' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#ff6699', fontFamily: 'monospace' }}>
            {title}
          </h2>
          <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
            Reproduciendo desde FrikiBot Server 🍞 | URL Segura
          </p>
        </div>

      </main>
    </div>
  );
}
