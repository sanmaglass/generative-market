import { useState, useEffect, useRef } from 'react'
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
    { id: 'neon', label: 'Cyber Neon', emoji: '⚡' },
    { id: 'minimal', label: 'Minimal White', emoji: '🤍' },
]

export default function ProductForm({ items, setItems, onAddMore, onBack, onDone }) {
    const addCameraRef = useRef()
    const addGalleryRef = useRef()

    // Determine aspect ratio from first item
    const aspectRatio = items.length > 0 ? items[0].aspect : 1

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
        const hasName = form.productName.trim().length > 0;
        const hasPrice = (form.unitEnabled && form.unitPrice) || 
                         (form.packEnabled && form.packPrice) || 
                         (form.boxEnabled && form.boxPrice);
        return hasName && hasPrice && items.length > 0;
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

    function handleAddFile(e) {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            onAddMore(files)
        }
        e.target.value = null
    }

    function updateItemQty(id, delta) {
        setItems(prev => prev.map(it =>
            it.id === id ? { ...it, qty: Math.max(1, Math.min(6, it.qty + delta)) } : it
        ))
    }

    function removeItem(id) {
        setItems(prev => prev.filter(it => it.id !== id))
    }

    const totalProducts = items.reduce((sum, it) => sum + it.qty, 0)

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

            {/* ─── Multi-product Preview ─── */}
            <div className="pf-combo-section">
                <div className="pf-combo-header">
                    <h3 className="pf-section-title">📸 Productos en la imagen ({totalProducts})</h3>
                </div>
                <div className="pf-combo-grid">
                    {items.map(item => (
                        <div key={item.id} className="pf-combo-card glass">
                            <button className="pf-combo-remove" onClick={() => removeItem(item.id)}>✕</button>
                            <img src={item.url} alt="Producto" className="pf-combo-img" />
                            <div className="pf-combo-qty">
                                <button className="pf-qty-btn" onClick={() => updateItemQty(item.id, -1)}>−</button>
                                <span className="pf-qty-val">x{item.qty}</span>
                                <button className="pf-qty-btn" onClick={() => updateItemQty(item.id, +1)}>+</button>
                            </div>
                            {item.bgBlob && <div className="pf-combo-ai-tag">✨ IA</div>}
                        </div>
                    ))}
                    {/* Add more button */}
                    <div className="pf-combo-add">
                        <button className="pf-combo-add-btn" onClick={() => addCameraRef.current.click()}>
                            📸<br /><span>Cámara</span>
                        </button>
                        <button className="pf-combo-add-btn" onClick={() => addGalleryRef.current.click()}>
                            🖼️<br /><span>Galería</span>
                        </button>
                    </div>
                </div>
                <p className="pf-combo-hint">Ajusta la cantidad con − / + · Hasta 6 del mismo producto</p>
            </div>

            <input ref={addCameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleAddFile} />
            <input ref={addGalleryRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleAddFile} />

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
                        <label>Etiqueta Promocional</label>
                        <div className="pf-promo-grid">
                            {PROMO_OPTIONS.map(opt => (
                                <button
                                    key={`promo-${opt.value}`}
                                    className={`pf-promo-btn ${form.promo === opt.value ? 'active' : ''}`}
                                    onClick={() => set('promo', opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="pf-field">
                        <label>Sello de Ahorro</label>
                        <div className="pf-promo-grid">
                            {ECO_BADGES.map(opt => (
                                <button
                                    key={`eco-${opt.value}`}
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
