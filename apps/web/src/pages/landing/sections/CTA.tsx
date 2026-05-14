import { CssParticles } from '../components/Particles'
import { usePixelNavigate } from '../hooks/usePixelNavigate'

export function CTASection() {
  const { go, overlay } = usePixelNavigate()

  return (
    <section className="landing-cta" id="cta">
      {overlay}
      <div className="landing-cta__stars" aria-hidden />
      <div className="landing-cta__rain" aria-hidden />
      <CssParticles count={48} />
      <div className="landing-cta__inner">
        <h2 className="landing-cta__title">
          <span className="landing-cta__line">YOLA</span>
          <span className="landing-cta__line">
            ÇIK
            <span className="landing-cta__period" aria-hidden>
              .
            </span>
          </span>
        </h2>
        <p className="landing-cta__sub">Kayıt 2 dakika sürer</p>
        <div className="landing-cta__btns">
          <button type="button" className="landing-cta__mega" data-cursor-hover onClick={() => go('/register')}>
            Hemen Kaydol
          </button>
          <button type="button" className="landing-cta__ghost" data-cursor-hover onClick={() => go('/demo')}>
            Demo Talep Et
          </button>
        </div>
      </div>
    </section>
  )
}
