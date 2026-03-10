import { useState, useEffect } from 'react'
import './ProductForm.css'

const PROMO_OPTIONS = [
    { label: 'Sin badge', value: '' },
    { label: '🔥 OFERTA', value: 'OFERTA' },
    { label: '✨ NUEVO', value: 'NUEVO' },
    { label: '⚡ LIQUIDACIÓN', value: 'LIQUIDACIÓN' },
    { label: '🎯 ESPECIAL', value: 'ESPECIAL' },
    { label: '💥 HOY SOLO', value: 'HOY SOLO' },
]

const ECO_BADGES = [
    { label: 'Sin sello', value: '' },
    { label: '💎 PRECIO SOCIO', value: 'PRECIO SOCIO' },
    { label: '🚀 DIRECTO BODEGA', value: 'DIRECTO BODEGA' },
    { label: '💰 AHORRO REAL', value: 'AHORRO REAL' },
    { label: '🎯 MEJOR OPCIÓN', value: 'MEJOR OPCIÓN' },
    { label: '🛒 PRECIO MAYOREO', value: 'PRECIO MAYOREO' },
]

const TEMPLATES = [
    { id: 'dark', label: 'Premium Dark', emoji: '🌙' },
    { id: 'market', label: 'Clean Market', emoji: '🏪' },
    { id: 'story', label: 'Social Story', emoji: '📱' },
]

export default function ProductForm({ rawImage, aspectRatio, onBack, onDone }) {
    const previewUrl = rawImage ? URL.createObjectURL(rawImage) : null

    const [form, setForm] = useState(() => {
        // Load Sticky Settings
        const sticky = JSON.parse(localStorage.getItem('snapbrand_sticky')) || {}
        return {
            productName: '',
            description: '',
            unitEnabled: true,
            unitQty: sticky.unitQty || '1',
            unitLabel: sticky.unitLabel || 'unidad',
            unitPrice: '',
            packEnabled: sticky.packEnabled ?? true,
            packQty: sticky.packQty || '12',
            packLabel: sticky.packLabel || 'manga',
            packPrice: '',
            boxEnabled: sticky.boxEnabled ?? true,
            boxQty: sticky.boxQty || '72',
            boxLabel: sticky.boxLabel || 'caja',
            boxPrice: '',
            promo: sticky.promo || 'OFERTA',
            eco: sticky.eco || 'PRECIO SOCIO',
            available: true,
            stockQty: '',
            template: aspectRatio < 0.8 ? 'story' : (sticky.template || 'dark'),
            removeBg: true,
        }
    })

    // Auto-calculate Manga and Box prices based on Unit Price
    useEffect(() => {
        const uPrice = parseFloat(form.unitPrice)
        if (!isNaN(uPrice) && uPrice > 0) {
            setForm(f => ({
                ...f,
                packPrice: f.packPrice || (Math.ceil(uPrice * 0.9 * parseFloat(f.packQty))).toString(),
                boxPrice: f.boxPrice || (Math.ceil(uPrice * 0.8 * parseFloat(f.boxQty))).toString(),
            }))
        }
    }, [form.unitPrice])

    function set(key, val) {
        setForm(f => ({ ...f, [key]: val }))
    }

    function canSubmit() {
        return form.productName.trim() && (form.unitEnabled && form.unitPrice)
    }

    function handleSubmit() {
        // Save Sticky Settings for next time
        const toSave = {
            unitQty: form.unitQty,
            unitLabel: form.unitLabel,
            packEnabled: form.packEnabled,
            packQty: form.packQty,
            packLabel: form.packLabel,
            boxEnabled: form.boxEnabled,
            boxQty: form.boxQty,
            boxLabel: form.boxLabel,
            promo: form.promo,
            eco: form.eco,
            template: form.template
        }
        localStorage.setItem('snapbrand_sticky', JSON.stringify(toSave))
        onDone(form)
    }

    return (
        <div className="pf-container fade-up">
            <div className="pf-topbar">
                <button className="pf-back" onClick={onBack}>← Salir</button>
                <h2 className="pf-title">Snap! ⚡</h2>
                <button
                    className="pf-submit-top"
                    disabled={!canSubmit()}
                    onClick={handleSubmit}
                >Generar</button>
            </div>

            <div className="pf-preview-wrap">
                <img src={previewUrl} alt="Producto" className="pf-preview-img" />
                <div className="pf-tag-badge">IA Activa ✨</div>
            </div>

            <div className="pf-form">
                <div className="pf-section">
                    <div className="pf-field">
                        <label>Nombre del Producto *</label>
                        <input
                            type="text"
                            placeholder="Ej: Galletas Oreo 126g"
                            autoFocus
                            value={form.productName}
                            onChange={e => set('productName', e.target.value)}
                        />
                    </div>
                </div>

                <div className="pf-section">
                    <h3 className="pf-section-title">💰 Precios (Auto-calculados)</h3>

                    <PriceTier
                        enabled={form.unitEnabled}
                        onToggle={v => set('unitEnabled', v)}
                        icon="💠"
                        qtyLabel="Cant."
                        qty={form.unitQty}
                        onQtyChange={v => set('unitQty', v)}
                        label={form.unitLabel}
                        onLabelChange={v => set('unitLabel', v)}
                        price={form.unitPrice}
                        onPriceChange={v => set('unitPrice', v)}
                        labelPlaceholder="unidad"
                        qtyPlaceholder="1"
                    />

                    <PriceTier
                        enabled={form.packEnabled}
                        onToggle={v => set('packEnabled', v)}
                        icon="📦"
                        qtyLabel="Cant."
                        qty={form.packQty}
                        onQtyChange={v => set('packQty', v)}
                        label={form.packLabel}
                        onLabelChange={v => set('packLabel', v)}
                        price={form.packPrice}
                        onPriceChange={v => set('packPrice', v)}
                        labelPlaceholder="manga"
                        qtyPlaceholder="12"
                    />

                    <PriceTier
                        enabled={form.boxEnabled}
                        onToggle={v => set('boxEnabled', v)}
                        icon="🗃️"
                        qtyLabel="Cant."
                        qty={form.boxQty}
                        onQtyChange={v => set('boxQty', v)}
                        label={form.boxLabel}
                        onLabelChange={v => set('boxLabel', v)}
                        price={form.boxPrice}
                        onPriceChange={v => set('boxPrice', v)}
                        labelPlaceholder="caja"
                        qtyPlaceholder="72"
                    />
                </div>

                <div className="pf-section">
                    <h3 className="pf-section-title">✨ Branding & Status</h3>
                    <div className="pf-field">
                        <div className="pf-promo-grid">
                            {ECO_BADGES.slice(1, 4).map(opt => (
                                <button
                                    key={opt.value}
                                    className={`pf-promo-btn ${form.eco === opt.value ? 'active' : ''}`}
                                    onClick={() => set('eco', opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pf-field pf-avail-row">
                        <div className="pf-avail-btns">
                            <button className={`pf-avail-btn ${form.available ? 'avail' : ''}`} onClick={() => set('available', true)}>✅ En Stock</button>
                            <button className={`pf-avail-btn ${!form.available ? 'unavail' : ''}`} onClick={() => set('available', false)}>❌ Agotado</button>
                        </div>
                        <input
                            type="number"
                            className="pf-stock-input"
                            placeholder="Stock (opcional)"
                            value={form.stockQty}
                            onChange={e => set('stockQty', e.target.value)}
                        />
                    </div>
                </div>

                <div className="pf-section">
                    <div className="pf-templates-mini">
                        {TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                className={`pf-template-pill ${form.template === t.id ? 'active' : ''}`}
                                onClick={() => set('template', t.id)}
                            >
                                {t.emoji} {t.label.split(' ')[1]}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    className="pf-submit"
                    disabled={!canSubmit()}
                    onClick={handleSubmit}
                >
                    🚀 CREAR IMAGEN HD
                </button>
            </div>
        </div>
    )
}

function PriceTier({ enabled, onToggle, icon, qty, onQtyChange, label, onLabelChange, price, onPriceChange, qtyPlaceholder, labelPlaceholder }) {
    return (
        <div className={`pf-tier ${enabled ? 'enabled' : ''}`}>
            <div className="pf-tier-header" onClick={() => onToggle(!enabled)}>
                <span className="pf-tier-icon">{icon}</span>
                <span className="pf-tier-title">{labelPlaceholder.charAt(0).toUpperCase() + labelPlaceholder.slice(1)}</span>
                <div className="pf-spacer" />
                <span className={`pf-check ${enabled ? 'active' : ''}`}>{enabled ? '✓' : ''}</span>
            </div>
            {enabled && (
                <div className="pf-tier-fields">
                    <div className="pf-tier-row">
                        <div className="pf-tier-col-qty">
                            <input type="number" value={qty} placeholder={qtyPlaceholder} onChange={e => onQtyChange(e.target.value)} />
                        </div>
                        <div className="pf-tier-col-label">
                            <input type="text" value={label} placeholder={labelPlaceholder} onChange={e => onLabelChange(e.target.value)} />
                        </div>
                        <div className="pf-tier-col-price">
                            <span className="pf-currency-sym">$</span>
                            <input type="number" value={price} placeholder="0" onChange={e => onPriceChange(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
