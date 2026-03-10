import { useRef } from 'react'
import './Home.css'

export default function Home({ brand, onImageSelected, onEditBrand }) {
    const fileInputRef = useRef()
    const cameraInputRef = useRef()

    function handleFile(e) {
        const file = e.target.files[0]
        if (file) onImageSelected(file)
    }

    const accent = brand?.colorPreset?.primary || '#f5c842'

    return (
        <div className="home-container fade-up">
            {/* Header */}
            <div className="home-header">
                <div className="home-brand-info" onClick={onEditBrand}>
                    {brand?.logoDataUrl
                        ? <img src={brand.logoDataUrl} alt="Logo" className="home-brand-logo" />
                        : <div className="home-brand-initial" style={{ background: accent }}>
                            {brand?.companyName?.[0]?.toUpperCase()}
                        </div>
                    }
                    <div>
                        <p className="home-brand-name">{brand?.companyName}</p>
                        {brand?.tagline && <p className="home-brand-tagline">{brand.tagline}</p>}
                    </div>
                    <span className="home-edit-icon">⚙️</span>
                </div>
            </div>

            {/* Hero */}
            <div className="home-hero">
                <div className="home-hero-glow" style={{ background: `radial-gradient(circle, ${accent}28 0%, transparent 70%)` }} />
                <div className="home-emoji float">🤖</div>
                <h1 className="home-title fade-up stagger-1">
                    Crea imágenes<br />
                    <span style={{ color: accent }}>que venden</span>
                </h1>
                <p className="home-subtitle fade-up stagger-2">
                    Foto del producto → Arte pro con precios y branding. En segundos. Con IA.
                </p>
            </div>

            {/* Quick stats */}
            <div className="home-stats fade-up stagger-3">
                <div className="home-stat glass stagger-1">
                    <span className="home-stat-val">⚡</span>
                    <span className="home-stat-label">Fondo IA</span>
                </div>
                <div className="home-stat glass stagger-2">
                    <span className="home-stat-val">💰</span>
                    <span className="home-stat-label">Precios</span>
                </div>
                <div className="home-stat glass stagger-3">
                    <span className="home-stat-val">📲</span>
                    <span className="home-stat-label">HD 1080</span>
                </div>
                <div className="home-stat glass stagger-4">
                    <span className="home-stat-val">✍️</span>
                    <span className="home-stat-label">Caption</span>
                </div>
            </div>

            {/* CTAs */}
            <div className="home-ctas">
                <button
                    className="home-btn-main"
                    style={{ background: accent, '--accent': accent }}
                    onClick={() => cameraInputRef.current.click()}
                >
                    📸 Tomar foto
                </button>
                <button
                    className="home-btn-secondary glass"
                    onClick={() => fileInputRef.current.click()}
                >
                    🖼️ Elegir de galería
                </button>
            </div>

            <p className="home-footer-note">
                Imágenes generadas en tu dispositivo — tus fotos nunca se suben a ningún servidor
            </p>

            {/* AI Assistant Character */}
            <div className="home-assistant-wrap">
                <div className="home-assistant-bubble glass">
                    ¡Listo para vender más! 🚀
                </div>
                <img src="/splash_ai.png" alt="Assistant" className="home-assistant-img" />
            </div>

            {/* Hidden file inputs */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
    )
}
