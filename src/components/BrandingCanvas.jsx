import { useEffect, useRef, useState } from 'react'
import './BrandingCanvas.css'

const CANVAS_W = 1080
const CANVAS_H = 1080

export default function BrandingCanvas({ items, productData, brand, onDone }) {
    const canvasRef = useRef()
    const [status, setStatus] = useState('Finalizando arte...')
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        let cancelled = false
        async function run() {
            try {
                setProgress(10)
                setStatus('Procesando imágenes...')

                // Step 1: Process all items — use pre-removed BG or remove now
                const productImages = []
                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    let blob = item.bgBlob

                    if (!blob && productData.removeBg) {
                        setStatus(`Recortando imagen ${i + 1}/${items.length} (IA)...`)
                        setProgress(10 + (i / items.length) * 40)
                        try {
                            const { removeBackground } = await import('@imgly/background-removal')
                            blob = await removeBackground(item.file, {
                                model: 'medium',
                                output: { format: 'image/png', quality: 1 }
                            })
                        } catch {
                            blob = item.file
                        }
                    } else if (!productData.removeBg) {
                        blob = item.file
                    }

                    if (cancelled) return
                    const img = await loadImage(URL.createObjectURL(blob))
                    productImages.push({ img, qty: item.qty })
                }

                if (cancelled) return
                setProgress(60)
                setStatus('Analizando colores...')

                // Use the first image for dominant color sampling
                const dominantColor = sampleDominantColor(productImages[0].img)
                if (cancelled) return

                setProgress(80)
                setStatus('Aplicando Branding Pro...')

                const canvas = canvasRef.current
                canvas.width = getTemplateW(productData.template)
                canvas.height = getTemplateH(productData.template)
                const ctx = canvas.getContext('2d')

                await drawBrandedImage(ctx, canvas, productImages, productData, brand, dominantColor)

                if (cancelled) return
                setProgress(95)
                setStatus('Finalizando...')

                canvas.toBlob(blob => {
                    if (!cancelled && blob) {
                        setProgress(100)
                        onDone({ blob, sampledColor: dominantColor })
                    }
                }, 'image/png', 1.0)

            } catch (err) {
                console.error(err)
                setStatus('Error al procesar. Intenta de nuevo.')
            }
        }
        run()
        return () => { cancelled = true }
    }, [])

    return (
        <div className="bc-container fade-up">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="bc-spinner-wrap">
                <div className="bc-ring">
                    <div className="bc-ring-inner" style={{ '--progress': `${progress}%` }} />
                    <div className="bc-ring-icon">⚡</div>
                </div>
                <h2 className="bc-status">{status}</h2>
                <div className="bc-progress-bar">
                    <div className="bc-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="bc-hint">Turbo Flow activo: IA trabajando en segundo plano...</p>

                <div className="bc-steps">
                    <Step done={progress >= 60} active={progress < 60 && progress >= 10} label="AI Processing" />
                    <Step done={progress >= 85} active={progress >= 60 && progress < 85} label="Smart Design" />
                    <Step done={progress >= 100} active={progress >= 85 && progress < 100} label="HD Export" />
                </div>
            </div>
        </div>
    )
}

function Step({ done, active, label }) {
    return (
        <div className={`bc-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
            <div className="bc-step-dot">
                {done ? '✓' : active ? <span className="spin">◌</span> : '·'}
            </div>
            <span>{label}</span>
        </div>
    )
}

// ─── Helpers ──────────────────────────────────────────────

function sampleDominantColor(img) {
    try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = 50
        canvas.height = 50
        ctx.drawImage(img, 0, 0, 50, 50)
        const data = ctx.getImageData(0, 0, 50, 50).data
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 200) { // ignore transparent
                r += data[i]; g += data[i + 1]; b += data[i + 2]; count++
            }
        }
        if (count === 0) return '#f5c842'
        return rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count))
    } catch {
        return '#f5c842'
    }
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

function getTemplateW(template) {
    return template === 'story' ? 1080 : 1080
}
function getTemplateH(template) {
    return template === 'story' ? 1920 : 1080
}

async function drawBrandedImage(ctx, canvas, productImages, productData, brand, productHue) {
    const W = canvas.width
    const H = canvas.height
    const template = productData.template || 'dark'
    const brandAccent = brand?.colorPreset?.primary || '#f5c842'
    const accent = productHue || brandAccent
    const currency = brand?.currency || 'USD'

    // ── Background ──
    if (template === 'dark') {
        ctx.fillStyle = '#060610'
        ctx.fillRect(0, 0, W, H)
        ctx.strokeStyle = hexToRgba(accent, 0.03)
        ctx.lineWidth = 1
        for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
        for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
        const aura1 = ctx.createRadialGradient(W * 0.38, H * 0.30, 0, W * 0.38, H * 0.30, W * 0.50)
        aura1.addColorStop(0, hexToRgba(accent, 0.11))
        aura1.addColorStop(1, 'transparent')
        ctx.fillStyle = aura1
        ctx.fillRect(0, 0, W, H)
        const aura2 = ctx.createRadialGradient(W * 0.72, H * 0.20, 0, W * 0.72, H * 0.20, W * 0.35)
        aura2.addColorStop(0, hexToRgba(brandAccent, 0.07))
        aura2.addColorStop(1, 'transparent')
        ctx.fillStyle = aura2
        ctx.fillRect(0, 0, W, H)
    } else if (template === 'market') {
        const bgMuted = colorDarken(accent, 0.1)
        ctx.fillStyle = '#f5f5f0'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = hexToRgba(accent, 0.02)
        for (let x = 0; x < W; x += 32) {
            for (let y = 0; y < H * 0.62; y += 32) {
                ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
            }
        }
    } else if (template === 'story') {
        const grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, '#0a0a16')
        grad.addColorStop(0.6, '#111128')
        grad.addColorStop(1, colorDarken(accent, 0.6))
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)
        const glow = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, W * 0.55)
        glow.addColorStop(0, hexToRgba(accent, 0.15))
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, W, H)
    } else if (template === 'neon') {
        ctx.fillStyle = '#050505'
        ctx.fillRect(0, 0, W, H)
        ctx.strokeStyle = hexToRgba(accent, 0.15)
        ctx.lineWidth = 1.5
        for (let y = H * 0.4; y < H; y += (y - H * 0.3) * 0.1) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
        }
        for (let x = -W; x < W * 2; x += 60) {
            ctx.beginPath(); ctx.moveTo(W / 2, H * 0.4); ctx.lineTo(x, H); ctx.stroke()
        }
        const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.6)
        glow.addColorStop(0, hexToRgba(accent, 0.25))
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, W, H)
    } else if (template === 'minimal') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, W, H)
        const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.5)
        glow.addColorStop(0, hexToRgba(accent, 0.08))
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, W, H)
    }

    // ── Bottom info band (drawn first, product will float on top) ──
    const bandY = template === 'story' ? H * 0.58 : H * 0.60
    const bandH = H - bandY
    drawBottomBand(ctx, W, H, bandY, bandH, template, accent, brandAccent, productData, brand, currency)

    // ── Product images float over the band boundary ──
    const productZone = getProductZone(template, W, H)
    drawMultiProductImages(ctx, productImages, productZone, template)

    // ── Header: Logo + company name ──
    await drawHeader(ctx, brand, W, H, template, brandAccent)

    // ── Promo badge ──
    if (productData.promo) {
        drawPromoBadge(ctx, productData.promo, W, H, template, brandAccent)
    }

    // ── Saving Badge (NEW) ──
    drawSavingBadge(ctx, productData, W, H, template, brandAccent)

    // ── Corner accent lines ──
    drawCornerAccents(ctx, W, H, accent)
}

function drawSavingBadge(ctx, productData, W, H, template, brandAccent) {
    if (!productData.eco) return

    ctx.save()
    const pad = W * 0.045
    const bx = pad
    const by = W * 0.14
    const bw = W * 0.32
    const bh = W * 0.07

    // Low Price / Economy indicator
    ctx.fillStyle = 'rgba(76, 175, 125, 0.12)'
    ctx.strokeStyle = '#4caf7d'
    ctx.lineWidth = 1.5
    roundRect(ctx, bx, by, bw, bh, 15)
    ctx.fill(); ctx.stroke()

    ctx.font = `800 ${W * 0.022}px Outfit, sans-serif`
    ctx.fillStyle = '#4caf7d'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(productData.eco, bx + bw / 2, by + bh / 2)
    ctx.restore()
}

function drawBottomBand(ctx, W, H, bandY, bandH, template, productAccent, brandAccent, productData, brand, currency) {
    const isDark = template === 'dark' || template === 'story' || template === 'neon'
    const pad = W * 0.045

    // ── Band background ──
    if (isDark) {
        // Dark base + red/yellow gradient for "oferta" energy
        const bandGrad = ctx.createLinearGradient(0, bandY, W, bandY + bandH)
        bandGrad.addColorStop(0, 'rgba(20, 8, 8, 0.97)')
        bandGrad.addColorStop(0.5, 'rgba(30, 10, 5, 0.97)')
        bandGrad.addColorStop(1, 'rgba(20, 8, 8, 0.97)')
        ctx.fillStyle = bandGrad
        ctx.fillRect(0, bandY, W, bandH)

        // Top border: red/gold gradient line (thick)
        const borderGrad = ctx.createLinearGradient(0, bandY, W, bandY)
        borderGrad.addColorStop(0, template === 'neon' ? productAccent : '#ff2200')
        borderGrad.addColorStop(0.5, template === 'neon' ? '#ffffff' : '#ffcc00')
        borderGrad.addColorStop(1, template === 'neon' ? productAccent : '#ff2200')
        ctx.fillStyle = borderGrad
        ctx.fillRect(0, bandY, W, 5)
    } else {
        const bandGrad = ctx.createLinearGradient(0, bandY, 0, bandY + bandH)
        bandGrad.addColorStop(0, brandAccent)
        bandGrad.addColorStop(1, colorDarken(brandAccent, 0.7))
        ctx.fillStyle = bandGrad
        ctx.fillRect(0, bandY, W, bandH)
        ctx.fillStyle = 'rgba(255,255,255,0.15)'
        ctx.fillRect(0, bandY, W, 3)
    }

    // ── Product name ──
    const nameY = bandY + bandH * 0.18
    ctx.save()
    ctx.font = `900 ${W * 0.052}px Outfit, sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    // White text with subtle red glow
    ctx.shadowColor = '#ff4400'
    ctx.shadowBlur = 15
    const maxNameW = W - pad * 2.5
    let name = (productData.productName || '').toUpperCase()
    while (name.length > 3 && ctx.measureText(name).width > maxNameW) name = name.slice(0, -1)
    if (name !== (productData.productName || '').toUpperCase()) name += '…'
    ctx.fillText(name, pad, nameY)
    ctx.shadowBlur = 0
    ctx.restore()

    // ── Price Pills (supermarket offer style) ──
    const sym = getCurrencySymbol(currency)
    const tiers = buildTiers(productData, sym)
    const numTiers = tiers.length

    if (numTiers > 0) {
        const gapX = W * 0.025
        const pillAreaY = bandY + bandH * 0.33
        const pillH = bandH * 0.54
        const pillW = (W - pad * 2 - gapX * (numTiers - 1)) / numTiers

        tiers.forEach((tier, i) => {
            const px = pad + i * (pillW + gapX)
            const py = pillAreaY
            const isFirst = i === 0

            ctx.save()

            if (isDark) {
                if (isFirst) {
                    // Hero price — red/yellow "ofertón" gradient
                    const heroGrad = ctx.createLinearGradient(px, py, px + pillW, py + pillH)
                    heroGrad.addColorStop(0, '#cc0000')
                    heroGrad.addColorStop(0.45, '#ff2200')
                    heroGrad.addColorStop(1, '#ff7700')
                    ctx.fillStyle = heroGrad
                    roundRect(ctx, px, py, pillW, pillH, 20)
                    ctx.fill()

                    // Inner highlight shimmer
                    const shine = ctx.createLinearGradient(px, py, px, py + pillH * 0.45)
                    shine.addColorStop(0, 'rgba(255,255,255,0.22)')
                    shine.addColorStop(1, 'rgba(255,255,255,0)')
                    ctx.fillStyle = shine
                    roundRect(ctx, px, py, pillW, pillH, 20)
                    ctx.fill()

                    // Gold border glow
                    ctx.shadowColor = '#ffcc00'
                    ctx.shadowBlur = 18
                    ctx.strokeStyle = '#ffdd00'
                    ctx.lineWidth = 3
                    roundRect(ctx, px, py, pillW, pillH, 20)
                    ctx.stroke()
                    ctx.shadowBlur = 0
                } else {
                    // Secondary prices — dark glass with subtle orange tint
                    ctx.fillStyle = 'rgba(255, 80, 0, 0.1)'
                    roundRect(ctx, px, py, pillW, pillH, 18)
                    ctx.fill()
                    const shine2 = ctx.createLinearGradient(px, py, px, py + pillH * 0.5)
                    shine2.addColorStop(0, 'rgba(255,255,255,0.08)')
                    shine2.addColorStop(1, 'rgba(255,255,255,0)')
                    ctx.fillStyle = shine2
                    roundRect(ctx, px, py, pillW, pillH, 18)
                    ctx.fill()
                    ctx.strokeStyle = 'rgba(255, 140, 0, 0.4)'
                    ctx.lineWidth = 1.5
                    roundRect(ctx, px, py, pillW, pillH, 18)
                    ctx.stroke()
                }
            } else {
                ctx.fillStyle = i === 0 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.12)'
                roundRect(ctx, px, py, pillW, pillH, 18)
                ctx.fill()
            }

            // Tier label
            const labelColor = isDark
                ? (isFirst ? 'rgba(255,240,160,0.95)' : 'rgba(255,180,100,0.7)')
                : 'rgba(0,0,0,0.55)'
            ctx.font = `700 ${W * 0.022}px Outfit, sans-serif`
            ctx.fillStyle = labelColor
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`x${tier.qty} ${tier.label}`, px + pillW / 2, py + pillH * 0.25)

            // BIG bold price — fills the pill
            const priceStr = `${tier.sym}${formatPrice(tier.price)}`
            let fontSize = pillW * 0.28
            ctx.font = `900 ${fontSize}px Outfit, sans-serif`
            while (ctx.measureText(priceStr).width > pillW * 0.88 && fontSize > pillW * 0.1) {
                fontSize -= 1
                ctx.font = `900 ${fontSize}px Outfit, sans-serif`
            }

            // Price text color: first = bold white with yellow glow, rest = white
            if (isDark && isFirst) {
                ctx.shadowColor = '#ffee00'
                ctx.shadowBlur = 20
                ctx.fillStyle = '#ffffff'
            } else if (isDark) {
                ctx.fillStyle = '#ff9922'
                ctx.shadowBlur = 0
            } else {
                ctx.fillStyle = '#000000'
            }
            ctx.fillText(priceStr, px + pillW / 2, py + pillH * 0.68)
            ctx.shadowBlur = 0

            ctx.restore()
        })

        // ── Starburst "¡OFERTA!" on the first pill ──
        if (isDark && numTiers > 0) {
            const bx = pad + pillW - W * 0.04
            const by = pillAreaY - W * 0.055
            drawStarburst(ctx, bx, by, W * 0.062, 8)
            ctx.fillStyle = '#ffdd00'
            ctx.fill()
            ctx.strokeStyle = '#ff2200'
            ctx.lineWidth = 2.5
            ctx.stroke()

            ctx.font = `900 ${W * 0.018}px Outfit, sans-serif`
            ctx.fillStyle = '#cc0000'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('¡$!', bx, by)
        }
    }

    // ── Bottom strip ──
    const stripY = bandY + bandH * 0.90
    const dotColor = productData.available !== false ? '#44ff88' : '#ff4d6d'
    const availLabel = productData.available !== false ? '● Disponible' : '● Agotado'
    ctx.font = `700 ${W * 0.022}px Outfit, sans-serif`
    ctx.fillStyle = dotColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(availLabel, pad, stripY)

    if (productData.stockQty) {
        ctx.font = `500 ${W * 0.02}px Outfit, sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.textAlign = 'center'
        ctx.fillText(`Stock: ${productData.stockQty}`, W / 2, stripY)
    }

    if (brand?.whatsapp) {
        ctx.font = `600 ${W * 0.021}px Outfit, sans-serif`
        ctx.fillStyle = 'rgba(255, 200, 80, 0.85)'
        ctx.textAlign = 'right'
        ctx.fillText(`📱 ${brand.whatsapp}`, W - pad, stripY)
    }
}

function getProductZone(template, W, H) {
    if (template === 'story') return { x: W * 0.05, y: H * 0.09, w: W * 0.90, h: H * 0.51 }
    if (template === 'market') return { x: W * 0.08, y: H * 0.10, w: W * 0.84, h: H * 0.52 }
    return { x: W * 0.08, y: H * 0.09, w: W * 0.84, h: H * 0.54 }
}

// Expand productImages array by qty: [{img, qty:2}] → [{img}, {img}]
function expandProducts(productImages) {
    const expanded = []
    for (const { img, qty } of productImages) {
        for (let i = 0; i < qty; i++) expanded.push(img)
    }
    return expanded
}

// Calculate grid layout positions for N items inside a zone
function computeLayout(imgs, zone) {
    const n = imgs.length
    if (n === 0) return []
    const { x, y, w, h } = zone

    if (n === 1) {
        return [{ img: imgs[0], x, y, w, h }]
    }
    if (n === 2) {
        const cellW = w * 0.48
        const gap = w * 0.04
        return [
            { img: imgs[0], x: x, y, w: cellW, h },
            { img: imgs[1], x: x + cellW + gap, y, w: cellW, h },
        ]
    }
    if (n === 3) {
        const cellW = w * 0.31
        const gap = w * 0.035
        return imgs.map((img, i) => ({
            img, x: x + i * (cellW + gap), y, w: cellW, h,
        }))
    }
    // 4+ items: 2-column grid
    const cols = n <= 4 ? 2 : 3
    const rows = Math.ceil(n / cols)
    const gapX = w * 0.03
    const gapY = h * 0.03
    const cellW = (w - gapX * (cols - 1)) / cols
    const cellH = (h - gapY * (rows - 1)) / rows
    return imgs.map((img, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        return {
            img,
            x: x + col * (cellW + gapX),
            y: y + row * (cellH + gapY),
            w: cellW,
            h: cellH,
        }
    })
}

function drawMultiProductImages(ctx, productImages, zone, template) {
    const imgs = expandProducts(productImages)
    const layout = computeLayout(imgs, zone)

    for (const cell of layout) {
        drawSingleProductImage(ctx, cell.img, cell, template)
    }
}

function drawSingleProductImage(ctx, img, zone, template) {
    const { x, y, w, h } = zone
    const scale = Math.min(w / img.width, h / img.height) * 0.90
    const dw = img.width * scale
    const dh = img.height * scale
    const dx = x + (w - dw) / 2
    const dy = y + (h - dh) / 2

    // Deep 3D Shadow (multi-layer)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 50
    ctx.shadowOffsetY = 20
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.shadowColor = 'rgba(0,0,0,0.50)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 6
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.restore()

    // ── Mirror / Glass Floor Reflection ──
    if (template === 'dark' || template === 'story' || template === 'neon') {
        ctx.save()
        const reflectY = dy + dh
        const reflectH = dh * 0.20
        ctx.translate(dx + dw / 2, reflectY)
        ctx.scale(1, -1)
        ctx.globalAlpha = 0.18
        ctx.drawImage(img, -dw / 2, 0, dw, dh)
        ctx.scale(1, -1)
        ctx.translate(-(dx + dw / 2), -reflectY)
        ctx.globalAlpha = 1
        const mask = ctx.createLinearGradient(0, reflectY, 0, reflectY + reflectH)
        mask.addColorStop(0, 'rgba(6,6,16,0.25)')
        mask.addColorStop(1, 'rgba(6,6,16,0.98)')
        ctx.fillStyle = mask
        ctx.fillRect(dx - 5, reflectY, dw + 10, reflectH)
        ctx.restore()
    }
}

async function drawHeader(ctx, brand, W, H, template, accent) {
    ctx.save()
    const isDark = template === 'dark' || template === 'story' || template === 'neon'
    const textColor = isDark ? '#ffffff' : '#111111'
    const pad = W * 0.045
    const headerH = W * 0.115
    const logoSize = headerH * 0.82

    if (!isDark) {
        ctx.fillStyle = 'rgba(255,255,255,0.90)'
        ctx.fillRect(0, 0, W, headerH + pad * 0.5)
    }

    let logoEndX = pad
    if (brand?.logoDataUrl) {
        try {
            const logoImg = await loadImage(brand.logoDataUrl)
            const lw = Math.min((logoImg.width / logoImg.height) * logoSize, W * 0.18)
            const ly = (headerH - logoSize) / 2
            ctx.drawImage(logoImg, pad, ly, lw, logoSize)
            logoEndX = pad + lw + W * 0.025
        } catch { }
    }

    if (brand?.companyName) {
        const cy = headerH / 2
        const offset = brand?.tagline ? -W * 0.018 : 0
        ctx.font = `800 ${W * 0.033}px Outfit, sans-serif`
        ctx.fillStyle = isDark ? accent : '#000' // Harmony: accent in headers
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(brand.companyName.toUpperCase(), logoEndX, cy + offset)
        if (brand?.tagline) {
            ctx.font = `400 ${W * 0.021}px Outfit, sans-serif`
            ctx.fillStyle = isDark ? 'rgba(255,255,255,0.44)' : 'rgba(0,0,0,0.45)'
            ctx.fillText(brand.tagline, logoEndX, cy + W * 0.022)
        }
    }
    ctx.restore()
}

function drawPromoBadge(ctx, promo, W, H, template, accent) {
    ctx.save()
    const bh = W * 0.088
    const bw = Math.max(W * 0.21, bh * 1.8)
    const bx = W - W * 0.04 - bw
    const by = W * 0.035
    const r = bh / 2
    ctx.shadowColor = hexToRgba(accent, 0.4) // Harmony: shadow matches accent
    ctx.shadowBlur = 20
    const grad = ctx.createLinearGradient(bx, by, bx + bw, by + bh)
    grad.addColorStop(0, accent)
    grad.addColorStop(1, colorDarken(accent, 0.8))
    ctx.fillStyle = grad
    roundRect(ctx, bx, by, bw, bh, r)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.font = `800 ${W * 0.03}px Outfit, sans-serif`
    ctx.fillStyle = isColorDark(accent) ? '#fff' : '#000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(promo, bx + bw / 2, by + bh / 2)
    ctx.restore()
}

function buildTiers(productData, sym) {
    const tiers = []
    if (productData.unitEnabled && productData.unitPrice)
        tiers.push({ qty: productData.unitQty, label: productData.unitLabel, price: productData.unitPrice, sym })
    if (productData.packEnabled && productData.packPrice)
        tiers.push({ qty: productData.packQty, label: productData.packLabel, price: productData.packPrice, sym })
    if (productData.boxEnabled && productData.boxPrice)
        tiers.push({ qty: productData.boxQty, label: productData.boxLabel, price: productData.boxPrice, sym })
    return tiers
}

function drawCornerAccents(ctx, W, H, accent) {
    ctx.save()
    ctx.strokeStyle = hexToRgba(accent, 0.35)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    const len = W * 0.048
    ctx.beginPath(); ctx.moveTo(W * 0.028, W * 0.028 + len); ctx.lineTo(W * 0.028, W * 0.028); ctx.lineTo(W * 0.028 + len, W * 0.028); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W - W * 0.028 - len, W * 0.028); ctx.lineTo(W - W * 0.028, W * 0.028); ctx.lineTo(W - W * 0.028, W * 0.028 + len); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W * 0.028, H - W * 0.028 - len); ctx.lineTo(W * 0.028, H - W * 0.028); ctx.lineTo(W * 0.028 + len, H - W * 0.028); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W - W * 0.028 - len, H - W * 0.028); ctx.lineTo(W - W * 0.028, H - W * 0.028); ctx.lineTo(W - W * 0.028, H - W * 0.028 - len); ctx.stroke()
    ctx.restore()
}

// ─── Utilities ──

function drawStarburst(ctx, cx, cy, r, spikes) {
    const outerR = r
    const innerR = r * 0.5
    let rot = (Math.PI / 2) * 3
    const step = Math.PI / spikes
    ctx.beginPath()
    ctx.moveTo(cx, cy - outerR)
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
        rot += step
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
        rot += step
    }
    ctx.lineTo(cx, cy - outerR)
    ctx.closePath()
}

function colorDarken(hex, factor = 0.8) {
    // Simple hex darkener
    const h = hex.replace('#', '')
    const r = Math.round(parseInt(h.slice(0,2), 16) * factor)
    const g = Math.round(parseInt(h.slice(2,4), 16) * factor)
    const b = Math.round(parseInt(h.slice(4,6), 16) * factor)
    return `rgb(${r},${g},${b})`
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
}




function isColorDark(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness < 128
}

function formatPrice(price) {
    const n = parseFloat(price)
    if (isNaN(n)) return price
    return n.toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function getCurrencySymbol(currency) {
    const map = { USD: '$', MXN: '$', ARS: '$', COP: '$', CLP: '$', PEN: 'S/.' }
    return map[currency] || '$'
}
