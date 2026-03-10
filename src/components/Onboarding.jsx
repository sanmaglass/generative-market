import { useState, useRef } from 'react'
import './Onboarding.css'

const COLOR_PRESETS = [
    { name: 'Dorado', primary: '#f5c842', secondary: '#0f0f1a' },
    { name: 'Azul Real', primary: '#6c63ff', secondary: '#0f0f1a' },
    { name: 'Teal', primary: '#00d4aa', secondary: '#0f0f1a' },
    { name: 'Rojo', primary: '#ff4d6d', secondary: '#1a0a0a' },
    { name: 'Naranja', primary: '#ff8c42', secondary: '#0f0f1a' },
    { name: 'Verde', primary: '#4caf7d', secondary: '#0a1a0f' },
]

export default function Onboarding({ onDone }) {
    const [step, setStep] = useState(0)
    const [data, setData] = useState({
        companyName: '',
        tagline: '',
        whatsapp: '',
        address: '',
        instagram: '',
        colorPreset: COLOR_PRESETS[0],
        logoDataUrl: null,
        currency: 'CLP',
    })
    const logoInputRef = useRef()

    function update(key, val) {
        setData(d => ({ ...d, [key]: val }))
    }

    function handleLogoFile(e) {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => update('logoDataUrl', ev.target.result)
        reader.readAsDataURL(file)
    }

    function next() {
        if (step < 3) setStep(s => s + 1)
        else onDone(data)
    }

    function canProceed() {
        if (step === 0) return data.companyName.trim().length > 1
        if (step === 1) return true // logo is optional
        if (step === 2) return true // color always has a default
        if (step === 3) return data.whatsapp.trim().length > 5
        return true
    }

    const steps = [
        {
            icon: '🏢',
            title: 'Nombre de tu empresa',
            subtitle: 'Así aparecerá en todas tus imágenes',
            content: (
                <div className="ob-field-group">
                    <div className="ob-field">
                        <label>Nombre de la empresa</label>
                        <input
                            type="text"
                            placeholder="Ej: Comercializadora XYZ"
                            value={data.companyName}
                            onChange={e => update('companyName', e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="ob-field">
                        <label>Slogan / tagline <span className="optional">(opcional)</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Distribuidores mayoristas"
                            value={data.tagline}
                            onChange={e => update('tagline', e.target.value)}
                        />
                    </div>
                    <div className="ob-field">
                        <label>Moneda</label>
                        <div className="ob-currency-row">
                            {['USD', 'MXN', 'ARS', 'COP', 'CLP', 'PEN'].map(c => (
                                <button
                                    key={c}
                                    className={`ob-chip ${data.currency === c ? 'active' : ''}`}
                                    onClick={() => update('currency', c)}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            icon: '🖼️',
            title: 'Tu logo',
            subtitle: 'Aparecerá en cada imagen generada',
            content: (
                <div className="ob-logo-section">
                    <div className="ob-logo-preview" onClick={() => logoInputRef.current.click()}>
                        {data.logoDataUrl
                            ? <img src={data.logoDataUrl} alt="Logo" />
                            : <div className="ob-logo-placeholder">
                                <span className="ob-logo-icon">📷</span>
                                <p>Toca para subir tu logo</p>
                                <small>PNG con fondo transparente recomendado</small>
                            </div>
                        }
                    </div>
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLogoFile}
                    />
                    {data.logoDataUrl && (
                        <button className="ob-change-logo" onClick={() => logoInputRef.current.click()}>
                            Cambiar logo
                        </button>
                    )}
                    <p className="ob-skip-note">Si no tienes logo, puedes continuar — usaremos el nombre de tu empresa.</p>
                </div>
            )
        },
        {
            icon: '🎨',
            title: 'Color principal',
            subtitle: 'Define el look de todas tus imágenes',
            content: (
                <div className="ob-colors">
                    {COLOR_PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            className={`ob-color-btn ${data.colorPreset.name === preset.name ? 'active' : ''}`}
                            onClick={() => update('colorPreset', preset)}
                        >
                            <div className="ob-color-swatch" style={{ background: preset.primary }} />
                            <span>{preset.name}</span>
                            {data.colorPreset.name === preset.name && <span className="ob-check">✓</span>}
                        </button>
                    ))}
                </div>
            )
        },
        {
            icon: '📱',
            title: 'Contacto & Ubicación',
            subtitle: 'Humaniza tu marca con datos reales de tu negocio',
            content: (
                <div className="ob-field-group">
                    <div className="ob-field">
                        <label>Número de WhatsApp</label>
                        <input
                            type="tel"
                            placeholder="+56 9 1234 5678"
                            value={data.whatsapp}
                            onChange={e => update('whatsapp', e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="ob-field">
                        <label>Dirección del local <span className="optional">(opcional)</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Grecia 1841, Hualpén"
                            value={data.address}
                            onChange={e => update('address', e.target.value)}
                        />
                    </div>
                    <div className="ob-field">
                        <label>Instagram <span className="optional">(opcional)</span></label>
                        <input
                            type="text"
                            placeholder="@tutienda"
                            value={data.instagram}
                            onChange={e => update('instagram', e.target.value)}
                        />
                    </div>
                    <div className="ob-preview-card glass">
                        <div className="ob-preview-line">
                            <span>💬</span>
                            <span>{data.whatsapp || '+56 9 1234 5678'}</span>
                        </div>
                        {data.address && <div className="ob-preview-line">
                            <span>📍</span>
                            <span>{data.address}</span>
                        </div>}
                        <div className="ob-preview-line">
                            <span>🏢</span>
                            <span>{data.companyName || 'Tu Empresa'}</span>
                        </div>
                    </div>
                </div>
            )
        }
    ]

    const currentStep = steps[step]

    return (
        <div className="ob-container fade-up">
            {/* Header */}
            <div className="ob-header">
                <div className="ob-logo-mark">
                    <span>⚡</span>
                </div>
                <h1 className="ob-app-name gold-text">SnapBrand</h1>
                <p className="ob-app-sub">Imágenes profesionales en segundos</p>
            </div>

            {/* Progress */}
            <div className="ob-progress">
                {steps.map((_, i) => (
                    <div key={i} className={`ob-dot ${i <= step ? 'active' : ''}`} />
                ))}
            </div>

            {/* Step card */}
            <div className="ob-card glass">
                <div className="ob-step-icon">{currentStep.icon}</div>
                <h2 className="ob-step-title">{currentStep.title}</h2>
                <p className="ob-step-sub">{currentStep.subtitle}</p>
                <div className="ob-step-content">
                    {currentStep.content}
                </div>
            </div>

            {/* CTA */}
            <button
                className="ob-cta"
                onClick={next}
                disabled={!canProceed()}
                style={{ '--accent': data.colorPreset.primary }}
            >
                {step < 3 ? 'Siguiente →' : '¡Listo, empezar! 🚀'}
            </button>
        </div>
    )
}
