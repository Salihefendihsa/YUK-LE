import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #272D3A', background: '#111318', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
      <span className="muted">© 2026 Navlonix</span>
      <span className="muted"><Link to="/kvkk">KVKK</Link> | <Link to="/kullanim-kosullari">Kullanım Koşulları</Link> | <Link to="/gizlilik">Gizlilik</Link></span>
      <span className="muted">v1.0.0 | destek@navlonix.com</span>
    </footer>
  )
}
