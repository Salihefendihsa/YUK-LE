import { CssParticles } from '../components/Particles'
import { usePixelNavigate } from '../hooks/usePixelNavigate'

export function CTASection() {
  const { go, overlay } = usePixelNavigate()

  return (
    <section className="landing-cta" id="cta">
      {overlay}
      <div className="landing-cta__stars" aria-hidden />
      <div className="landing-cta__rain" aria-hidden />
      <CssParticles count={72} />
      <div className="landing-cta__inner">
        <h2 className="landing-cta__title">
          <span className="landing-cta__line">YOLA</span>
          <span className="landing-cta__line">ÇIK.</span>
        </h2>
        <p className="landing-cta__sub">Kayıt 2 dakika sürer</p>
        <div className="landing-cta__btns">
          <button type="button" className="landing-cta__mega" data-cursor-hover onClick={() => go('/register')}>
            Hemen kaydol
          </button>
          <button type="button" className="landing-cta__ghost" data-cursor-hover onClick={() => go('/register')}>
            Demo talep et
          </button>
        </div>
      </div>
    </section>
  )
}
