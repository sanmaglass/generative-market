import { useState, useEffect } from 'react'
import './ResultScreen.css'

export default function ResultScreen({ blob, accent, productData, brand, onReset }) {
    const [imageUrl, setImageUrl] = useState(null)
    const [caption, setCaption] = useState('')
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState('preview') // 'preview' | 'caption'

    useEffect(() => {
        if (blob) {
            const url = URL.createObjectURL(blob)
            setImageUrl(url)
            setCaption(generateCaption(productData, brand))
            return () => URL.revokeObjectURL(url)
        }
    }, [blob])

    function downloadHD() {
        const a = document.createElement('a')
        a.href = imageUrl
        a.download = `${safeFilename(productData.productName || 'producto')}_HD.png`
        a.click()
    }

    async function copyCaption() {
        try {
            await navigator.clipboard.writeText(caption)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch {
            // fallback: select all text
        }
    }

    const uiAccent = accent || brand?.colorPreset?.primary || '#f5c842'

    return (
        <div className="rs-container fade-up">
            {/* Top bar */}
            <div className="rs-topbar">
                <button className="rs-back" onClick={onReset}>✕</button>
                <h2 className="rs-title">¡Lista para compartir!</h2>
                <button className="rs-new" onClick={onReset}>+ Nueva</button>
            </div>

            {/* Tab switcher */}
            <div className="rs-tabs">
                <button className={`rs-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')} style={{ '--accent': uiAccent }}>
                    🖼️ Imagen
                </button>
                <button className={`rs-tab ${activeTab === 'caption' ? 'active' : ''}`} onClick={() => setActiveTab('caption')} style={{ '--accent': uiAccent }}>
                    ✍️ Caption IG
                </button>
            </div>

            {/* Preview tab */}
            {activeTab === 'preview' && (
                <div className="rs-preview-section fade-up">
                    <div className="rs-image-wrap">
                        {imageUrl && <img src={imageUrl} alt="Producto generado" className="rs-preview-img" />}
                        <div className="rs-image-badge">1080×1080 HD</div>
                    </div>

                    <div className="rs-action-row">
                        <button className="rs-btn-main" onClick={downloadHD} style={{ background: uiAccent }}>
                            ⬇️ Descargar HD
                        </button>
                    </div>

                    <div className="rs-tips">
                        <div className="rs-tip glass">
                            <span>📲</span>
                            <div>
                                <strong>WhatsApp</strong>
                                <p>Descarga y envía desde tu galería</p>
                            </div>
                        </div>
                        <div className="rs-tip glass">
                            <span>📸</span>
                            <div>
                                <strong>Instagram</strong>
                                <p>Ve a caption para el texto listo</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Caption tab */}
            {activeTab === 'caption' && (
                <div className="rs-caption-section fade-up">
                    <div className="rs-caption-header">
                        <p className="rs-caption-hint">Caption completo para Instagram listo para copiar:</p>
                    </div>

                    <textarea
                        className="rs-caption-area"
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        rows={14}
                    />

                    <div className="rs-caption-actions">
                        <button className="rs-btn-main" onClick={copyCaption} style={{ background: uiAccent }}>
                            {copied ? '✅ ¡Copiado!' : '📋 Copiar caption'}
                        </button>
                        <button className="rs-btn-regen" onClick={() => setCaption(generateCaption(productData, brand))}>
                            🔄 Regenerar variante
                        </button>
                    </div>

                    <div className="rs-caption-tips glass">
                        <p>💡 <strong>Tip:</strong> Puedes editar el texto directamente antes de copiar. Los hashtags ya están optimizados para mayoreo.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Caption Generator ──────────────────────────────────

function generateCaption(productData, brand) {
    const company = brand?.companyName || 'El local'
    const whatsapp = brand?.whatsapp || ''
    const address = brand?.address || ''
    const instagram = brand?.instagram || ''
    const currency = brand?.currency || 'CLP'
    const sym = getCurrencySymbol(currency)
    const name = productData?.productName || 'este producto'
    const desc = productData?.description || ''
    const available = productData?.available !== false
    const eco = productData?.eco || ''

    // Humanized openers — rotate randomly
    const openers = [
        `¡Mira lo que tenemos! 👀\n${name} ya disponible en ${company}.`,
        `¡A esto se le llama precio real! 🔥\n${name} directo desde ${company}.`,
        `¿Buscabas ${name}? Tenemos para ti 🎯\nCompra en ${company} y ahorra de verdad.`,
        `Llegó ${name} y la queremos mover rápido 🚀\nNo te quedes sin la tuya — ${company}.`,
    ]
    const opener = openers[Math.floor(Math.random() * openers.length)]

    // Humanized pricing lines
    const priceLines = []
    if (productData?.unitEnabled && productData?.unitPrice)
        priceLines.push(`💠 ${productData.unitQty} ${productData.unitLabel} → ${sym}${productData.unitPrice}`)
    if (productData?.packEnabled && productData?.packPrice)
        priceLines.push(`📦 ${productData.packLabel} de ${productData.packQty} → solo ${sym}${productData.packPrice}`)
    if (productData?.boxEnabled && productData?.boxPrice)
        priceLines.push(`🗃️ ${productData.boxLabel} de ${productData.boxQty} → ${sym}${productData.boxPrice} (precio de bodega)`)

    const ecoLine = eco ? `\n✳️ ${eco} — comprando en cantidad siempre sale mejor.\n` : ''

    // Availability with personality
    const availLine = available
        ? `✅ Disponible ahora mismo — entrega coordinada por WhatsApp.`
        : `⚠️ Stock limitado — escríbenos antes de que se agote.`

    // Location block — builds trust
    const locationBlock = address
        ? `\n📍 Encuéntranos en: ${address}`
        : ''

    // CTAs — more human, less robotic
    const ctaVariants = [
        `📲 Escríbenos al ${whatsapp} y coordinamos tu pedido.`,
        `💬 Mándanos un mensaje al ${whatsapp} — respondemos rápido.`,
        `📱 Pedidos al ${whatsapp} — también despacho a coordinarse.`,
    ]
    const cta = whatsapp ? ctaVariants[Math.floor(Math.random() * ctaVariants.length)] : ''

    const instaLine = instagram ? `\n📸 Síguenos en ${instagram} para más ofertas.` : ''

    const hashtags = buildHashtags(productData, brand)

    return [
        opener,
        desc ? `\n${desc}\n` : '',
        '─────────────────────',
        '💰 Precios:',
        ...priceLines,
        ecoLine,
        '─────────────────────',
        availLine,
        locationBlock,
        cta,
        instaLine,
        '',
        `🏢 ${company}`,
        '',
        hashtags
    ].filter(l => l !== null && l !== undefined && l !== '').join('\n')
}


function buildHashtags(productData, brand) {
    const base = ['#mayoreo', '#distribuidores', '#compraalpormayor', '#negocio', '#emprendimiento', '#ventasmayoristas']
    if (brand?.companyName) {
        const slug = brand.companyName.toLowerCase().replace(/\s+/g, '')
        base.push(`#${slug}`)
    }
    if (productData?.productName) {
        const words = productData.productName.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        words.slice(0, 3).forEach(w => base.push(`#${w}`))
    }
    base.push('#ofertasdeldia', '#stock', '#pedidos', '#whatsappbusiness')
    return base.join(' ')
}

function getCurrencySymbol(currency) {
    const map = { USD: '$', MXN: '$', ARS: '$', COP: '$', CLP: '$', PEN: 'S/.' }
    return map[currency] || '$'
}

function safeFilename(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40)
}
