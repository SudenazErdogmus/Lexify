import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [level, setLevel] = useState('B1')
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = (e) => {
    e.preventDefault()
    if(!url) return;
    
    // Şimdilik sadece bir uyarı veriyoruz. 
    // Bir sonraki adımda burayı Django API'sine bağlayacağız.
    setIsLoading(true)
    setTimeout(() => {
      alert(`Analiz edilecek link: ${url} \nSeviye: ${level}`)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="container">
      <header>
        <h1>Lexify</h1>
        <p>Yapay Zeka Destekli Dil Öğrenme Asistanı</p>
      </header>

      <main className="card">
        <form onSubmit={handleAnalyze}>
          <div className="input-group">
            <label>İçerik Linki (YouTube, Medium, Blog)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Seviyeniz</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="A1">A1 - Başlangıç</option>
              <option value="A2">A2 - Temel</option>
              <option value="B1">B1 - Orta</option>
              <option value="B2">B2 - Orta İleri</option>
              <option value="C1">C1 - İleri</option>
              <option value="C2">C2 - Ustalık</option>
            </select>
          </div>

          <button type="submit" className="analyze-btn" disabled={isLoading}>
            {isLoading ? 'Analiz Ediliyor...' : 'Metni Analiz Et'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default App