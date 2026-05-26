import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const REVIEWS = [
  {
    name: 'Ayşe Korkmaz',
    job: 'Operasyon Müdürü',
    company: 'Anadolu Gıda A.Ş.',
    text: "Eskiden telefon trafiğiyle uğraşıyorduk, şimdi her şey uygulamada. Akıllı eşleştirmenin önerdiği fiyatlar gayet adil, ne çok ne az.",
    when: '6 hafta önce',
    tenure: '6 aydır kullanıyor',
    trips: '38 sefer tamamlandı',
    grad: 0,
  },
  {
    name: 'Mehmet Yılmaz',
    job: 'Şoför',
    company: 'Bireysel taşımacı',
    text: 'Şoförle anlaşıp parayı havuzda görünce içim rahat etti. Teslim olunca direkt cebime düştü. Pratik olmuş.',
    when: '2 hafta önce',
    tenure: '1 yıldır kullanıyor',
    trips: '52 sefer tamamlandı',
    grad: 1,
  },
  {
    name: 'Elif Demir',
    job: 'Satın Alma Uzmanı',
    company: 'Vadi Mobilya',
    text: 'Daha önce 3-4 gün süren teklif toplama işi yarım saatte bitiyor. Ekipte hepimiz çok memnunuz.',
    when: '1 ay önce',
    tenure: '4 aydır kullanıyor',
    trips: '29 sefer tamamlandı',
    grad: 2,
  },
  {
    name: 'Hasan Çelik',
    job: 'Lojistik Koordinatörü',
    company: 'Anadolu Tekstil',
    text: 'İlanı verdim, 10 dakika içinde 5 teklif geldi. Şoför evrakları akıllı doğrulama ile kontrolden geçmiş, içim rahat.',
    when: '3 hafta önce',
    tenure: '3 aydır kullanıyor',
    trips: '41 sefer tamamlandı',
    grad: 3,
  },
  {
    name: 'Fatma Aydın',
    job: 'İşletme Sahibi',
    company: 'Aydın Lojistik',
    text: "Eşim baktı dedi 'bu uygulama nasıl bu kadar kolay'. Ben de 'akıllı eşleştirme yapıyor' dedim, anlamadı ama beğendi 😄",
    when: '5 gün önce',
    tenure: '8 aydır kullanıyor',
    trips: '47 sefer tamamlandı',
    grad: 4,
  },
  {
    name: 'Murat Şahin',
    job: 'Tır Şoförü',
    company: 'Bireysel taşımacı',
    text: "Yola çıkmadan müşterinin yolda olduğunu gördüğüm yerlere bayılıyorum. Eskiden 'nerdesin abi' telefonları bitti.",
    when: '2 ay önce',
    tenure: '5 aydır kullanıyor',
    trips: '33 sefer tamamlandı',
    grad: 0,
  },
  {
    name: 'Zeynep Kara',
    job: 'Genel Müdür',
    company: 'Kara Holding',
    text: 'KVKK uyumlu olduğunu görünce ekibimize güvenle önerebildim. Vergi entegrasyonları da temiz.',
    when: '1 hafta önce',
    tenure: '2 aydır kullanıyor',
    trips: '12 sefer tamamlandı',
    grad: 1,
  },
  {
    name: 'Ahmet Doğan',
    job: 'Şoför',
    company: 'Doğan Nakliyat',
    text: "İlk başta 'bir uygulama da bu mu' dedim ama bir denedim, devam ediyorum. Telefonla pazarlık yapmaktan iyi.",
    when: '10 gün önce',
    tenure: '10 aydır kullanıyor',
    trips: '61 sefer tamamlandı',
    grad: 2,
  },
] as const

function gradClass(i: number) {
  return `landing-reviews__avatar landing-reviews__avatar--g${i % 5}`
}

function MarqueeRow({ reverse }: { reverse?: boolean }) {
  const doubled = [...REVIEWS, ...REVIEWS]
  return (
    <div className={`landing-reviews__row${reverse ? ' landing-reviews__row--rev' : ''}`}>
      <div className="landing-reviews__marquee">
        {doubled.map((r, i) => (
          <article key={`${r.name}-${i}`} className="landing-reviews__card" data-cursor-hover>
            <div className="landing-reviews__top">
              <div className="landing-reviews__who">
                <div className={gradClass(r.grad)} aria-hidden>
                  {r.name[0]}
                </div>
                <div>
                  <p className="landing-reviews__name">{r.name}</p>
                  <p className="landing-reviews__job">{r.job}</p>
                  <p className="landing-reviews__company">{r.company}</p>
                </div>
              </div>
              <span className="landing-reviews__verified">✓ Doğrulanmış</span>
            </div>
            <div className="landing-reviews__stars" aria-label="5 üzerinden 5">
              ★★★★★
            </div>
            <p className="landing-reviews__quote">{r.text}</p>
            <p className="landing-reviews__meta">{r.when}</p>
            <div className="landing-reviews__foot">
              <span>{r.tenure}</span>
              <span>{r.trips}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    gsap.fromTo(
      el.querySelectorAll('.landing-reviews__reveal'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
      },
    )
  }, [])

  return (
    <section ref={root} className="landing-reviews" id="reviews">
      <div className="landing-reviews__head-block landing-reviews__reveal">
        <h2 className="landing-reviews__h2">Kullanıcılarımız Ne Diyor?</h2>
        <p className="landing-reviews__lead">Türkiye&apos;nin dört bir yanından gerçek kullanıcı deneyimleri.</p>
      </div>
      <div className="landing-reviews__rows landing-reviews__reveal">
        <MarqueeRow />
        <MarqueeRow reverse />
      </div>
      <div className="landing-reviews__stats landing-reviews__reveal">
        <div className="landing-reviews__stat">
          <strong>⭐ 4.9/5</strong>
          <span>Ortalama Puan</span>
        </div>
        <div className="landing-reviews__stat">
          <strong>👥 12.5K+</strong>
          <span>Aktif Kullanıcı</span>
        </div>
        <div className="landing-reviews__stat">
          <strong>💬 8K+</strong>
          <span>Olumlu Yorum</span>
        </div>
      </div>
    </section>
  )
}
