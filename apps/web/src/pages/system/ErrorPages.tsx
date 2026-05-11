import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export function NotFoundPage() {
  return <div className="page-wrap"><h1 className="page-title">404 - Sayfa Bulunamadı</h1><p className="page-sub">Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p></div>
}

export function UnauthorizedPage() {
  return <div className="page-wrap"><h1 className="page-title">401 - Yetkisiz Erişim</h1><p className="page-sub">Bu alanı görüntülemek için yetkiniz bulunmuyor.</p></div>
}

export function ServerErrorPage() {
  return <div className="page-wrap"><h1 className="page-title">500 - Sunucu Hatası</h1><p className="page-sub">Beklenmeyen bir hata oluştu, lütfen tekrar deneyin.</p></div>
}

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} - ${error.statusText}` : 'Beklenmeyen bir uygulama hatası oluştu.'
  return (
    <div className="page-wrap">
      <h1 className="page-title">Uygulama Hatası</h1>
      <p className="page-sub">{message}</p>
    </div>
  )
}
