import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<string>('Bilinmiyor');

  const checkHealth = async () => {
    try {
      setStatus('Bağlanılıyor...');
      const res = await fetch('http://localhost:5000/health', { method: 'GET' });
      if (res.ok) {
        setStatus('✅ Backend Ayakta (200 OK)');
      } else {
        setStatus(`⚠️ Backend Hata Döndürdü (${res.status})`);
      }
    } catch (error) {
      setStatus('❌ Backend ile bağlantı kurulamadı (CORS veya Sunucu Kapalı)');
    }
  }

  return (
    <>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>YÜK-LE Web Paneli</h1>
        <div className="card" style={{ marginTop: '2rem' }}>
          <button onClick={checkHealth} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            Backend Sistem Kontrolü
          </button>
          <p style={{ marginTop: '1rem', fontSize: '18px' }}>Backend Durumu: <strong>{status}</strong></p>
        </div>
        <p className="read-the-docs" style={{ marginTop: '3rem', color: '#888' }}>
          Faz 6: Kurumsal Web Monorepo Geçişi Başarıyla Tamamlandı.
        </p>
      </div>
    </>
  )
}

export default App
