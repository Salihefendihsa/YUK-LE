import './Page.css'

export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="page-wrap">
      <div className="card">
        <h1 className="page-title">{title}</h1>
        <p className="page-sub" style={{ marginTop: 8 }}>
          {description}
        </p>
      </div>
    </div>
  )
}
