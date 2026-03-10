import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('entering');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'),  120);
    const t2 = setTimeout(() => setPhase('exiting'), 3000);
    const t3 = setTimeout(() => onComplete(),         3800);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`splash-container ${phase}`}>
      {/* Ambient orbs */}
      <div className="splash-orb splash-orb-1" />
      <div className="splash-orb splash-orb-2" />
      <div className="splash-orb splash-orb-3" />

      <div className="splash-content">
        {/* Character with spinning gradient ring */}
        <div className="image-wrapper">
          <div className="image-ring" />
          <div className="image-inner">
            <img src="/splash_ai.png" alt="Generative Market AI" className="splash-image" />
          </div>
        </div>

        <span className="splash-badge">Powered by AI</span>
        <h1 className="splash-title">GENERATIVE<br/>MARKET</h1>
        <p className="splash-subtitle">Transforma tu marca con IA</p>

        {/* Loading bar */}
        <div className="splash-loader">
          <div className="splash-loader-fill" />
        </div>
      </div>
    </div>
  );
}
