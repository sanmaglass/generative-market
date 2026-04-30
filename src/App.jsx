import { useState, useEffect } from 'react'
import Onboarding from './components/Onboarding.jsx'
import Home from './components/Home.jsx'
import ProductForm from './components/ProductForm.jsx'
import BrandingCanvas from './components/BrandingCanvas.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import SplashScreen from './components/SplashScreen.jsx'

// App states: 'onboarding' | 'home' | 'form' | 'processing' | 'result'
export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [screen, setScreen] = useState(() => {
    const brand = localStorage.getItem('snapbrand_brand')
    return brand ? 'home' : 'onboarding'
  })

  const [brand, setBrand] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('snapbrand_brand')) || null
    } catch { return null }
  })

  const [items, setItems] = useState([]) // [{ id, file, url, aspect, bgBlob, qty }]
  const [productData, setProductData] = useState(null)
  const [resultBlob, setResultBlob] = useState(null)
  const [resultAccent, setResultAccent] = useState(null)

  function handleOnboardingDone(brandData) {
    localStorage.setItem('snapbrand_brand', JSON.stringify(brandData))
    setBrand(brandData)
    setScreen('home')
  }

  async function handleImageSelected(files) {
    const newItems = await Promise.all(files.map(async (file) => {
      const url = URL.createObjectURL(file)
      const aspect = await new Promise(resolve => {
        const img = new Image()
        img.onload = () => resolve(img.width / img.height)
        img.src = url
      })
      return { id: Math.random().toString(36).slice(2), file, url, aspect, bgBlob: null, qty: 1 }
    }))

    setItems(prev => [...prev, ...newItems])
    setScreen('form')

    // ⚡ Turbo: start BG removal
    newItems.forEach(item => {
      setTimeout(async () => {
        try {
          const { removeBackground } = await import('@imgly/background-removal')
          const blob = await removeBackground(item.file, {
            model: 'small',
            output: { format: 'image/png', quality: 1 }
          })
          setItems(current => current.map(it => it.id === item.id ? { ...it, bgBlob: blob } : it))
        } catch (e) {
          console.warn('Silent BG removal failed for', item.id, e)
        }
      }, 500)
    })
  }

  function handleFormDone(data) {
    setProductData(data)
    setScreen('processing')
  }

  function handleCanvasDone({ blob, sampledColor }) {
    setResultBlob(blob)
    setResultAccent(sampledColor)
    setScreen('result')
  }

  function handleReset() {
    setItems([])
    setProductData(null)
    setResultBlob(null)
    setScreen('home')
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <div className="gradient-bg" style={{ minHeight: '100dvh' }}>
      {screen === 'onboarding' && (
        <Onboarding onDone={handleOnboardingDone} />
      )}
      {screen === 'home' && (
        <Home brand={brand} onImageSelected={handleImageSelected} onEditBrand={() => setScreen('onboarding')} />
      )}
      {screen === 'form' && (
        <ProductForm 
          items={items} 
          setItems={setItems}
          onAddMore={handleImageSelected}
          onBack={() => setScreen('home')} 
          onDone={handleFormDone} 
        />
      )}
      {(screen === 'processing') && (
        <BrandingCanvas
          items={items}
          productData={productData}
          brand={brand}
          onDone={handleCanvasDone}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          blob={resultBlob}
          accent={resultAccent}
          productData={productData}
          brand={brand}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
