import { useEffect } from 'react'
import '../../styles/landing-marketing.css'
import { LandingScrollProvider } from './LandingScrollProvider'
import { LandingNavbar } from './LandingNavbar'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { Features } from './Features'
import { LandingFooter } from './LandingFooter'

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add('landing-marketing-active')
    return () => {
      document.documentElement.classList.remove('landing-marketing-active')
    }
  }, [])

  return (
    <LandingScrollProvider>
      <div className="landing-marketing">
        <LandingNavbar />
        <main>
          <Hero />
          <HowItWorks />
          <Features />
        </main>
        <LandingFooter />
        <div id="demo" className="sr-only" aria-hidden />
      </div>
    </LandingScrollProvider>
  )
}
