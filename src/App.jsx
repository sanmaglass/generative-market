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

  const [rawImage, setRawImage] = useState(null)
  const [aspectRatio, setAspectRatio] = useState(1) // w/h
  const [removedBgBlob, setRemovedBgBlob] = useState(null) // Parallel AI processing
  const [productData, setProductData] = useState(null)
  const [resultBlob, setResultBlob] = useState(null)
  const [resultAccent, setResultAccent] = useState(null)

  function handleOnboardingDone(brandData) {
    localStorage.setItem('snapbrand_brand', JSON.stringify(brandData))
    setBrand(brandData)
    setScreen('home')
  }

  async function handleImageSelected(file) {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setAspectRatio(img.width / img.height)
      setRawImage(file)
      setScreen('form')
    }
    img.src = url

    // ⚡ Turbo: start BG removal after 1.5s so the form loads first (UI stays fluid)
    setTimeout(async () => {
      try {
        const { removeBackground } = await import('@imgly/background-removal')
        const blob = await removeBackground(file, {
          model: 'small', // faster, still great quality
          output: { format: 'image/png', quality: 1 }
        })
        setRemovedBgBlob(blob)
      } catch (e) {
        console.warn('Silent BG removal failed:', e)
      }
    }, 1500)
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
    setRawImage(null)
    setRemovedBgBlob(null)
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
        <ProductForm rawImage={rawImage} aspectRatio={aspectRatio} onBack={() => setScreen('home')} onDone={handleFormDone} />
      )}
      {(screen === 'processing') && (
        <BrandingCanvas
          rawImage={rawImage}
          preProcessedBlob={removedBgBlob}
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
