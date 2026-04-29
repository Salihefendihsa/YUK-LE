# YÜK-LE — Figma Design Brief
### Web Dashboard & Mobile App · v1.0 · Nisan 2026

---

## İÇİNDEKİLER

1. [Ürün Özeti & Tasarım Vizyonu](#1-ürün-özeti--tasarım-vizyonu)
2. [Kullanıcı Personaları](#2-kullanıcı-personaları)
3. [Marka Kimliği & Ton](#3-marka-kimliği--ton)
4. [Design Tokens — Renk](#4-design-tokens--renk)
5. [Design Tokens — Tipografi](#5-design-tokens--tipografi)
6. [Design Tokens — Spacing, Radius, Shadow](#6-design-tokens--spacing-radius-shadow)
7. [Komponent Kütüphanesi](#7-komponent-kütüphanesi)
8. [Sayfa & Ekran Mimarisi](#8-sayfa--ekran-mimarisi)
9. [Sayfa Detayları — Web](#9-sayfa-detayları--web)
10. [Sayfa Detayları — Mobile (Flutter)](#10-sayfa-detayları--mobile-flutter)
11. [Etkileşim & Animasyon Rehberi](#11-etkileşim--animasyon-rehberi)
12. [Responsive Breakpoint'ler](#12-responsive-breakpoints)
13. [Erişilebilirlik (A11y) Gereksinimleri](#13-erişilebilirlik-a11y-gereksinimleri)
14. [Figma Dosya Organizasyonu](#14-figma-dosya-organizasyonu)

---

## 1. Ürün Özeti & Tasarım Vizyonu

### Ne Yapıyor?
YÜK-LE; fabrikaları ve endüstriyel üreticileri, güvenilir ve belgeli tır şoförleriyle **saniyeler içinde buluşturan**, yapay zeka destekli B2B lojistik pazaryeridir. Eski usul WhatsApp pazarlıklarının, belirsiz nakit ödemelerin ve belge kaosunun sonunu getiriyor.

### Tasarım Vizyonu (Tek Cümle)
> **"Endüstriyel güç, dijital zariflik — her şoför ve fabrika müdürünün güvenle kullandığı, hem sert hem akıllı bir platform."**

### Tasarımın 3 Kişiliği
| Kişilik | Anlamı | Nasıl Yansıtılır |
|---|---|---|
| **Güvenilir** | Para ve kargo söz konusu — yanılgı yok | Net hiyerarşi, bold renk, net CTA'lar |
| **Akıllı** | AI, gerçek zamanlı veri, anlık kararlar | Data visualization, subtle gradient, canlı pulse animasyonlar |
| **Hızlı** | Şoför arabadadır, fabrika müdürü toplantıdadır | Az tıklama, büyük hedef alanlar, anlaşılır ikonlar |

### Rekabet Analizi — Referans Uygulamalar
Tasarımcının incelemesi gereken ürünler (görsel dil ilhamı için, kopya için değil):
- **Uber Freight** — Sürücü ekranı simplicity'si
- **Convoy** — Yük ilan listesi hierarchy'si
- **Stripe Dashboard** — Veri yoğun panel layout'u
- **Linear** — Hız hissi, keyboard-first, dark mode kalitesi
- **Flexport** — B2B lojistik dashboard ton'u

---

## 2. Kullanıcı Personaları

### Persona A — FABRİKA MÜDÜRü / LOJİSTİK SORUMLUSU

```
İsim         : Mehmet Bey
Yaş          : 42
Rol          : Tekstil fabrikasının lojistik müdürü
Cihaz        : Masaüstü bilgisayar (ofis), bazen tablet
Teknik seviye: Orta — ERP kullanmış ama mobil app expert değil
Birincil hedef: Sabah 08:30'da tırı yola çıkarmak, akşam fatura kesilmiş olsun
Acı noktaları: Şoför bulmak için 10 telefon etmek, fiyat bilmemek, evrak takibi
Başarı kriteri: 3 tıkta ilan oluştur → teklif al → onayla → takip et
```

**UI İhtiyaçları:**
- Büyük, okunaklı font (36px+ başlıklar dashboardda)
- Kompakt ama anlaşılır form alanları ilan oluşturma için
- Haritada yükün nerede olduğunu tek bakışta görmek
- Mobil erişim ikincil, web öncelikli

---

### Persona B — TIR ŞOFÖRÜ

```
İsim         : Hakan Abi
Yaş          : 35
Rol          : Serbest tır şoförü (kendi aracı)
Cihaz        : Android telefon (büyük ekran), arabada monteli
Teknik seviye: Düşük-orta — sadece WhatsApp ve harita uygulaması kullanmış
Birincil hedef: Boş gitmemek, iyi para kazanmak, belge takibi
Acı noktaları: Güzergah boşta dönmek, aldatıcı iş verenler, evrak karmaşası
Başarı kriteri: Yakınımdaki yük ilanını gör → fiyata bak → teklif ver → yükle
```

**UI İhtiyaçları:**
- Devasa tap alanları (min 56px yükseklik)
- Tek elle kullanım: tüm kritik aksiyonlar alt yarıda
- Gece modu zorunlu (şoför geceleri de çalışır)
- Kısaca bilgi: yük ne, nereden-nereye, kaç TL

---

### Persona C — PLATFORM ADMİNİ

```
Rol          : YÜK-LE operasyon ekibi
Cihaz        : Masaüstü
İhtiyaç      : Belge onay/red, kullanıcı yönetimi, analizler
```

---

## 3. Marka Kimliği & Ton

### Logo Karakteri
YÜK-LE logosu şu özellikleri taşımalı:
- Kelimede gizli "YÜK" kısmı güçlü / ağır hissettirmeli
- "-LE" eki aksiyon / yükle / harekete geç enerjisi
- Wordmark: **Geometric sans-serif**, condensed, büyük harf tercihli
- Sembol (icon): Stilize tır ön silueti ya da kargo kutusu + yukarı ok — minimalist, monochrome çalışmalı

### Ses Tonu (Copy Guidance for Designers)
| Yanlış | Doğru |
|---|---|
| "Lütfen bekleyin, işleminiz devam ediyor..." | "Yükünüz yola çıkıyor." |
| "Hata oluştu. Lütfen tekrar deneyin." | "Bir sorun çıktı. Hemen yeniden dene." |
| "Teklif gönderildi!" | "Teklif gönderildi — fabrika şimdi görüyor." |
| "Kullanıcı adı veya şifre hatalı" | "Bilgiler eşleşmedi. Tekrar dene." |

### Vizüel Referans Mood
- **Ağır endüstri + dijital precision** karışımı
- Gece yarısı siyahı üzerine sıcak turuncu aksan — inşaat sektörünün kasiyeri değil, Tesla'nın fabrikası
- Fotoğraf kullanılacaksa: gerçek tırlar, gerçek yollar — stock foto değil

---

## 4. Design Tokens — Renk

### Ana Palet

```
BRAND PRIMARY — Turuncu Güç
--color-brand-500    : #FF6B00   ← Ana CTA, aktif state, vurgu
--color-brand-400    : #FF8C38   ← Hover state
--color-brand-300    : #FFAD70   ← Disabled, secondary accent
--color-brand-600    : #CC5500   ← Pressed state
--color-brand-900    : #3D1A00   ← Dark mode'da çok koyu turuncu bg

BRAND NEUTRAL — Gece Grafiti (Siyah Gamı)
--color-neutral-950  : #090B0E   ← Dark mode app background
--color-neutral-900  : #111318   ← Dark mode surface
--color-neutral-800  : #1C2029   ← Dark mode card
--color-neutral-700  : #272D3A   ← Dark mode elevated card, hover
--color-neutral-600  : #3A4252   ← Border, divider (dark)
--color-neutral-400  : #6B7280   ← Placeholder text
--color-neutral-300  : #9CA3AF   ← Secondary text
--color-neutral-200  : #D1D5DB   ← Light mode border
--color-neutral-100  : #F3F4F6   ← Light mode background
--color-neutral-050  : #F9FAFB   ← Light mode card

STATUS COLORS
--color-success-500  : #22C55E   ← Onay, aktif yük, başarı
--color-success-50   : #F0FDF4   ← Başarı bg (light mode)
--color-warning-500  : #F59E0B   ← Bekleme, bekleyen onay
--color-warning-50   : #FFFBEB   ← Uyarı bg
--color-error-500    : #EF4444   ← Hata, iptal, red
--color-error-50     : #FEF2F2   ← Hata bg
--color-info-500     : #3B82F6   ← Bilgi, araçta, aktif konum

AI ACCENT — Yapay Zeka Moru
--color-ai-500       : #8B5CF6   ← AI önerileri, Gemini badge'leri
--color-ai-300       : #C4B5FD   ← AI glow, subtle highlight
--color-ai-50        : #F5F3FF   ← AI panel bg (light mode)
```

### Renk Kullanım Kuralları
- **Turuncu (#FF6B00)** sadece birincil CTA buton, aktif navigation item, ilerleme çubuğu için
- Beyaz üzerine turuncu kullanımında kontrast oranı minimum **4.5:1** (AA standard)
- Siyah arka plan üzerinde yazı rengi minimum **#D1D5DB** (neutral-300)
- AI önerisi içeren herhangi bir bileşen mutlaka **mor accent** taşımalı (küçük badge, ince border, ya da subtle gradient)
- Başarı/hata/uyarı renkleri asla tek başına anlamı iletmemeli — ikon + renk birlikte kullanılmalı

---

## 5. Design Tokens — Tipografi

### Font Stack
```
Başlık (Display/Heading) : "Plus Jakarta Sans" — Variable, 400-800
Gövde (Body/UI)          : "Inter" — Variable, 400-600
Monospace (kod, ID, plaka): "JetBrains Mono" — 400-500
```
> Google Fonts üzerinden erişilebilir. Plus Jakarta Sans'ın condensed ağırlıkları YÜK-LE'nin güçlü ve modern tonuna mükemmel oturuyor.

### Type Scale

```
Display XL   : 56px / Line height 1.1 / Weight 800 / Letter-spacing -0.02em
Display L    : 44px / Line height 1.15 / Weight 700
Heading 1    : 36px / Line height 1.2 / Weight 700
Heading 2    : 28px / Line height 1.25 / Weight 600
Heading 3    : 22px / Line height 1.3 / Weight 600
Heading 4    : 18px / Line height 1.4 / Weight 600
Body XL      : 18px / Line height 1.6 / Weight 400
Body L       : 16px / Line height 1.6 / Weight 400  ← Ana gövde metni
Body M       : 14px / Line height 1.55 / Weight 400 ← Kart açıklamaları
Body S       : 12px / Line height 1.5 / Weight 400  ← Meta bilgi, timestamp
Label L      : 14px / Line height 1.0 / Weight 600  ← Buton metni (büyük buton)
Label M      : 13px / Line height 1.0 / Weight 600  ← Buton metni (orta)
Label S      : 11px / Line height 1.0 / Weight 700  ← Badge, chip, tag
Code         : 13px / JetBrains Mono / Weight 400   ← Plaka, ID, koordinat
```

### Tipografi Kuralları
- Sayfa başlığı her zaman **Plus Jakarta Sans Bold** — ağırlık hissi verir
- Form label'ları **Inter SemiBold 14px**, required field için sonuna `*` (turuncu)
- Harita üzerindeki label'lar **Inter Bold 12px** — küçük ama okunaklı
- Plaka numaraları, yük ID'leri, koordinatlar her zaman **JetBrains Mono**

---

## 6. Design Tokens — Spacing, Radius, Shadow

### Spacing Scale (4px Base Grid)
```
--space-1   : 4px
--space-2   : 8px
--space-3   : 12px
--space-4   : 16px
--space-5   : 20px
--space-6   : 24px
--space-8   : 32px
--space-10  : 40px
--space-12  : 48px
--space-16  : 64px
--space-20  : 80px
--space-24  : 96px
```

### Border Radius
```
--radius-sm    : 6px    ← Input, küçük badge
--radius-md    : 10px   ← Buton, card, dropdown
--radius-lg    : 16px   ← Modal, büyük card, panel
--radius-xl    : 24px   ← Bottom sheet, floating card
--radius-full  : 9999px ← Pill badge, avatar, toggle
```

### Shadow (Dark Mode Odaklı + Light Mode)
```
-- Dark Mode --
--shadow-sm    : 0 1px 3px rgba(0,0,0,0.4)
--shadow-md    : 0 4px 16px rgba(0,0,0,0.5)
--shadow-lg    : 0 8px 32px rgba(0,0,0,0.6)
--shadow-brand : 0 4px 24px rgba(255,107,0,0.25)  ← CTA buton glow
--shadow-ai    : 0 4px 20px rgba(139,92,246,0.2)   ← AI bileşen glow

-- Light Mode --
--shadow-sm    : 0 1px 4px rgba(0,0,0,0.08)
--shadow-md    : 0 4px 16px rgba(0,0,0,0.10)
--shadow-lg    : 0 8px 32px rgba(0,0,0,0.12)
```

### Z-Index Katmanları
```
--z-base        : 0
--z-card        : 10
--z-dropdown    : 100
--z-sticky      : 200
--z-overlay     : 300
--z-modal       : 400
--z-toast       : 500
--z-tooltip     : 600
```

---

## 7. Komponent Kütüphanesi

> Her komponent için Dark Mode + Light Mode variant'ı zorunludur.
> Her komponent için Default, Hover, Focus, Active, Disabled state'leri olmalıdır.

---

### 7.1 BUTONLAR

#### Primary Button (Ana CTA)
```
Height        : 48px (büyük) / 40px (orta) / 32px (küçük)
Min Width     : 120px
Padding       : 0 24px (büyük) / 0 20px (orta) / 0 14px (küçük)
Background    : --color-brand-500
Color         : #FFFFFF
Border Radius : --radius-md
Font          : Label L
Icon desteği  : Sol veya sağ, 20px, gap 8px

States:
  Default  → bg: #FF6B00, shadow: --shadow-brand
  Hover    → bg: #FF8C38, transform: translateY(-1px), shadow daha belirgin
  Active   → bg: #CC5500, transform: translateY(0)
  Disabled → bg: #FF6B0033, color: #FF6B0066, cursor: not-allowed
  Loading  → Spinner (16px, beyaz) + metin değişir "Yükleniyor..."
```

#### Secondary Button
```
Background    : transparent
Border        : 1.5px solid --color-brand-500
Color         : --color-brand-500
(Dark mode'da border ve text --color-brand-400)

Hover         → bg: --color-brand-500 opacity 10%
```

#### Ghost Button
```
Background    : transparent
Border        : none
Color         : --color-neutral-300
Hover         → bg: --color-neutral-700 (dark) / --color-neutral-100 (light)
```

#### Danger Button
```
Background    : --color-error-500
Sadece destructive aksiyonlar için (ilan iptal, hesap silme)
```

#### Icon Button (Sadece İkon)
```
Size          : 40x40px (orta) / 32x32px (küçük)
Border Radius : --radius-md veya --radius-full
Background    : --color-neutral-800 (dark)
İkon          : 20px
```

---

### 7.2 FORM BİLEŞENLERİ

#### Text Input
```
Height        : 48px
Border        : 1.5px solid --color-neutral-600 (dark) / --color-neutral-200 (light)
Border Radius : --radius-md
Background    : --color-neutral-800 (dark) / #FFFFFF (light)
Padding       : 0 16px
Font          : Body L, --color-neutral-100 (dark)

States:
  Focus   → border: --color-brand-500, box-shadow: 0 0 0 3px rgba(255,107,0,0.15)
  Error   → border: --color-error-500, helper text altında kırmızı
  Success → border: --color-success-500
  Disabled→ opacity 0.4, cursor: not-allowed

Ekler:
  - Leading icon (sol, 20px, --color-neutral-400)
  - Trailing icon (sağ, clear butonu ya da durum ikonu)
  - Label üstte, Body S weight 500
  - Helper text altında, Body S --color-neutral-400
  - Character count sağ alt (opsiyonel)
```

#### Select / Dropdown
```
Aynı Text Input görünümü
Trailing    : ChevronDown ikonu, animasyonlu (180° rotasyon açılınca)
Dropdown    : --radius-lg card, --shadow-lg, max-height 320px, scroll
Item height : 44px, hover --color-neutral-700
Active item : --color-brand-500 background %10 + checkmark ikonu
```

#### Textarea
```
Min height  : 120px
Resize      : Sadece dikey (resize: vertical)
Line height : 1.6
Karakter sayacı sağ alt
```

#### Konum/Adres Input (Özel Bileşen)
```
Sol ikon    : MapPin (--color-brand-500)
Autocomplete: Açılır öneri listesi, her item'da pin ikonu + şehir/ilçe
"Haritadan Seç" butonu: input'un sağında, --radius-md, secondary style
```

#### Araç Tipi Seçici (Custom)
```
Görünüm     : Horizontal scroll card listesi
Her kart    : 96x80px, araç silueti ikonu (üstte), isim (altta)
             Tır 40t / Kamyon 20t / Frigorifik / Lowboy / Tanker
Active      : --color-brand-500 border, background hafif turuncu tint
```

#### Tarih & Saat Seçici
```
Input tıklanınca: Native datepicker değil, custom popover calendar
Takvim stili  : Minimal, sadece gün sayıları ve ok navigasyonu
Bugün         : --color-brand-500 circle
Seçili        : --color-brand-500 fill, beyaz yazı
Geçmiş günler : opacity 0.3, tıklanamaz
```

#### File Upload (Belge Yükleme — Özel)
```
Görünüm       : Dashed border box, 200x120px minimum
İçerik        : Upload cloud ikonu (32px) + "Belgeyi sürükle ya da tıkla"
                + "JPG, PNG, PDF · Maks 10MB" (Body S)
Drag hover    : Border --color-brand-500, background turuncu tint
Yüklendi      : Dosya adı + boyut + preview thumbnail (PDF için generic ikon)
               + Sil butonu (X ikonu)
Progress      : Linear progress bar --color-brand-500
AI Analiz     : Upload sonrası mor badge "Gemini analiz ediyor..." + spinner
AI Sonuç OK   : Yeşil checkmark + "Ehliyet geçerli · Bitiş: 2027"
AI Sonuç ERROR: Kırmızı uyarı + "Belge okunamadı, tekrar yükle"
AI Gri Alan   : Sarı uyarı + "Manuel inceleme gerekiyor"
```

#### Toggle / Switch
```
Width         : 48px, height: 28px
Track         : --color-neutral-600 (off) → --color-brand-500 (on)
Thumb         : Beyaz circle, shadow
Animasyon     : 200ms ease spring
```

#### Checkbox & Radio
```
Size          : 20x20px
Border        : 1.5px solid --color-neutral-600
Checked       : --color-brand-500 fill + beyaz checkmark/dot
Focus         : 3px turuncu outline
```

---

### 7.3 KARTLAR (CARDS)

#### Yük İlanı Kartı (LoadCard)
```
Boyut         : Full width (liste görünümü) ya da 360px (grid)
Padding       : 20px
Border Radius : --radius-lg
Background    : --color-neutral-800 (dark)
Border        : 1px solid --color-neutral-700
Hover         : Border --color-brand-500 opacity 40%, translateY(-2px), --shadow-md

Yapısı (yukarıdan aşağı):
┌─────────────────────────────────────────────────┐
│  [Durum Badge]              [AI Fiyat Badge 🤖]  │
│                                                   │
│  📍 İZMİR, Kemalpaşa OSB                         │  ← Heading 4
│     ↓ 847 km                                      │  ← Body S, --color-neutral-400
│  📍 ANKARA, Ostim                                 │  ← Heading 4
│                                                   │
│  ─────────────────────────────────────────────   │
│  🚛 Tır 40t    📦 Tekstil    ⚖️ 18.000 kg        │  ← Body M ikonlu chips
│                                                   │
│  📅 Yarın, 08:30                                  │  ← Body M
│                                                   │
│  ─────────────────────────────────────────────   │
│  Taban Fiyat                                      │  ← Label S, --color-neutral-400
│  ₺ 12.500                    [Teklif Ver →]      │  ← Heading 2 + Primary Button
└─────────────────────────────────────────────────┘

Durum Badge türleri:
  🟢 Aktif       → success-500
  🟡 Teklif Bekleniyor → warning-500
  🔵 Yolda       → info-500
  ⚫ Tamamlandı   → neutral-400
  🔴 İptal       → error-500
```

#### Teklif Kartı (BidCard)
```
Kompakt versiyon: Fabrika görünümü için sıralı liste
Sol taraf  : Şoför avatarı (40px) + isim + araç plakası
Orta       : ₺ fiyat (Heading 3, turuncu) + "AI öneri ₺12.200" (Body S, mor)
Sağ taraf  : [Onayla] + [Reddet] butonları
Alt bar    : Şoför rating yıldızları + tamamlanan sefer sayısı
```

#### Dashboard İstatistik Kartı (StatCard)
```
Boyut      : Flexible, min 200px genişlik
İçerik:
  İkon     : 40x40px, --radius-lg bg, muted renk
  Değer    : Display L ya da Heading 1 (bold, beyaz)
  Etiket   : Body M, --color-neutral-400
  Trend    : ↑ %12 (yeşil) veya ↓ %5 (kırmızı) + "bu ay"
```

#### Şoför Profil Kartı (DriverCard)
```
Header     : Cover görseli (arka plan gradient) + Avatar (64px, ring border)
Body       :
  Ad Soyad + Unvan
  ⭐ 4.8 (127 sefer)
  Araç tipi + Plaka (JetBrains Mono)
  Belgeler: [✓ Ehliyet] [✓ SRC] [✓ Psikoteknik] chips
  Konum    : "İzmir'den 23 km" + gün/saat aktiflik
```

---

### 7.4 NAVIGATION BİLEŞENLERİ

#### Web — Sol Sidebar (Desktop)
```
Genişlik   : 240px (expanded) / 64px (collapsed)
Background : --color-neutral-900
Border     : 1px solid --color-neutral-800 sağ kenarda

Üst bölüm  : Logo (expanded) ya da ikon (collapsed)
Nav Items  :
  İkon (24px) + Etiket (Label M)
  Active    : Left border 3px --color-brand-500 + bg --color-neutral-800
  Hover     : bg --color-neutral-800
  Badge     : Bildirim sayısı, sağ tarafta, --color-brand-500 pill
  
Gruplar    :
  — Genel: Dashboard, İlanlar, Teklif
  — [divider]
  — Takip: Canlı Harita, Geçmiş
  — [divider]
  — Hesap: Profil, Belgeler, Ayarlar
  
Alt bölüm  : Avatar + isim + rol badge + Logout butonu

Collapse butonu: Sağ kenar ortasında, ChevronLeft/Right
```

#### Mobile — Bottom Navigation Bar
```
Height     : 64px + safe area bottom
Background : --color-neutral-900
Border     : 1px solid --color-neutral-800 üstte
İtemler    : 5 adet maksimum (Anasayfa, İlanlar, Teklif+, Takip, Profil)
Aktif item : İkon --color-brand-500 + etiket görünür
Pasif item : İkon --color-neutral-400 + etiket gizli (sadece aktifkende göster)
Orta item  : FAB stili "+" butonu, --color-brand-500, 56x56px, yükselmiş
```

#### Top App Bar (Mobile)
```
Height     : 56px + status bar
Sol        : Geri butonu (varsa) veya Logo
Orta       : Sayfa başlığı (Heading 4)
Sağ        : İkon butonlar (max 2: Bildirim, Arama)
Bildirim   : Kırmızı nokta badge (8px, unread varsa)
```

---

### 7.5 VERİ GÖRSELLEŞTİRME

#### Canlı Harita Bileşeni
```
Kütüphane  : Mapbox GL JS (önerilir) ya da Google Maps
Tema       : Dark mode custom map style (siyah yol, gri arazi, turuncu POI'lar)
Marker türleri:
  🟠 Yük çıkış noktası  : Turuncu daire + kutu ikonu
  🔴 Varış noktası      : Kırmızı pin
  🚛 Araç konumu        : Tır silueti, heading'e göre dönen, canlı pulse
  📦 Bekleme noktası    : Gri daire
Rota       : Turuncu polyline, 3px, animated dash (yolda olan yük için)
Info popup : Karta benzer, --radius-lg, shadow, yük bilgisi + ETA
```

#### İlerleme Adımları (Stepper)
```
Yük durumu için: 5 adım
  [Oluşturuldu] → [Teklif Alındı] → [Onaylandı] → [Yolda] → [Teslim Edildi]
  
Görünüm    : Yatay çizgi üzerinde daireler
Tamamlanan : --color-success-500 fill + checkmark
Aktif      : --color-brand-500 + pulse animasyonu
Bekleme    : --color-neutral-600 empty

Mobile için : Dikey stepper, her adımda timestamp göster
```

#### AI Fiyat Göstergesi (Özel Bileşen)
```
Yapısı:
  [🤖 Gemini Fiyat Analizi]                    ← Mor badge/header
  
  ₺ 11.800 — ₺ 13.400                          ← Range, Heading 2
  Önerilen: ₺ 12.500                            ← Bold, --color-brand-500
  
  Slider: ────────●─────                        ← Kullanıcı ayarlar
  
  Hesaplama detayları (collapsible):
  • Mesafe (847 km) × Yakıt (₺7.2/L)   = ₺8.200
  • Araç tipi (Tır 40t)                 = +₺1.800
  • Güzergah zorluğu (D750)             = +₺500
  • AI düzeltme faktörü                 = +₺0
                                     ─────────
  • Toplam Taban                        = ₺10.500
  
  [Önerilen Fiyatı Kullan]  [Manuel Gir]
```

---

### 7.6 GERİ BİLDİRİM BİLEŞENLERİ

#### Toast / Snackbar
```
Konum      : Sağ üst (web) / Alt ortada (mobile), yukarı çıkar
Genişlik   : 360px (web) / Full width minus 32px (mobile)
Height     : 56px minimum
Padding    : 16px
Border Radius: --radius-md
Süre       : 4 saniye (hata = 6 saniye, kalıcı X butonu)

Türler:
  Success  : Sol border 4px --color-success-500 + CheckCircle ikonu
  Error    : Sol border 4px --color-error-500 + XCircle ikonu
  Warning  : Sol border 4px --color-warning-500 + AlertTriangle ikonu
  Info     : Sol border 4px --color-info-500 + Info ikonu
  AI       : Sol border 4px --color-ai-500 + Sparkles ikonu
```

#### Modal / Dialog
```
Overlay    : rgba(0,0,0,0.7) backdrop blur 4px
Modal bg   : --color-neutral-800
Border Radius: --radius-xl
Max width  : 480px (küçük) / 640px (orta) / 800px (büyük)
Padding    : 32px
Başlık     : Heading 3 + X butonu sağ üstte
Footer     : Butonlar sağ tarafta, gap 12px

Animasyon  : scale 0.95 → 1.0 + fade in, 200ms
Mobile     : Full-width bottom sheet, sürükle-kapat
```

#### Skeleton Loader
```
Her kart ve liste item için skeleton versiyonu olmalı
Renk       : --color-neutral-700 (dark) / --color-neutral-200 (light)
Animasyon  : Shimmer (soldan sağa parlama, 1.5s loop)
Gecikme    : 300ms sonra göster (hızlı yüklemelerde titreme önlemi)
```

#### Empty State
```
Her boş liste/sayfa için illüstrasyon + metin + CTA
İllüstrasyon: Minimal line art, marka renklerinde, 160x160px
Başlık     : Heading 3
Açıklama   : Body L, --color-neutral-400
CTA        : Primary buton
Örnekler   :
  - İlan yok    : Tır illüstrasyonu + "Henüz ilan yok · İlk ilanını oluştur"
  - Teklif yok  : Elverişli şoför illüstrasyonu + "Henüz teklif gelmedi"
  - Sonuç yok   : Arama büyüteci + "Aramanızla eşleşen ilan bulunamadı"
```

---

## 8. Sayfa & Ekran Mimarisi

### Web — Fabrika Kullanıcısı

```
/login                  ← Giriş
/register               ← Kayıt (fabrika)
/dashboard              ← Ana panel
/loads                  ← İlanlarım listesi
/loads/new              ← Yeni ilan oluştur (3 adımlı wizard)
/loads/:id              ← İlan detayı + teklif yönetimi
/loads/:id/track        ← Canlı takip haritası
/bids                   ← Tüm teklifler
/drivers/:id            ← Şoför profili
/payments               ← Ödeme geçmişi (yol haritası)
/profile                ← Fabrika profili & ayarlar
/admin/*                ← Admin panel (ayrı layout)
```

### Mobile — Şoför Kullanıcısı

```
Onboarding (3 slide)
  → Giriş / Kayıt
  → Belge Yükleme (Ehliyet, SRC, Psikoteknik)
  → Araç Bilgileri
  → Profil Aktifleştirme Bekleniyor (Admin onayı)

Ana Akış (Bottom Nav):
  Home          ← Yakınımdaki yükler + AI öneri
  İlanlar       ← Filtreli yük arama
  [FAB +]       ← Hızlı teklif ver (en son görüntülenen ilanlar)
  Takip         ← Aktif yükümün durumu + harita
  Profil        ← Belgeler, araç, ayarlar, kazanç
```

---

## 9. Sayfa Detayları — Web

### 9.1 GİRİŞ SAYFASI (/login)

**Layout:** Split-screen, sol %45 / sağ %55

```
SOL PANEL (Karanlık, brand):
  Background : --color-neutral-950 + subtle diagonal çizgiler (5% opacity white)
  İçerik     :
    Logo (orta büyüklük)
    Tagline: "Yükünüz Güvende, Yolunuz Açık."
    3 özellik bullet (ikon + kısa metin):
      ⚡ Saniyeler içinde eşleştirme
      🤖 AI destekli adil fiyat
      🔒 KVKK uyumlu güvenli ödeme
    Alt kısım: Animasyonlu tır silueti (süzülür hareket, subtle)

SAĞ PANEL (Form):
  Background  : --color-neutral-900
  İçerik      :
    "Tekrar hoşgeldiniz" (Heading 2)
    "Hesabınıza girin" (Body L, neutral-400)
    [E-posta Input]
    [Şifre Input] + "Şifremi Unuttum" linki (sağda, Body S)
    [Giriş Yap] Primary Button, full-width
    ─── veya ───
    [Google ile Devam] Ghost buton (Google ikonu)
    Alt: "Hesabınız yok mu? Kayıt Olun" linki

RESPONSIVE: Mobil web için full-screen tek panel
```

---

### 9.2 KAYIT SAYFASI (/register)

**Rol seçimi ilk adım:**
```
BÜYÜK rol kartları (yan yana 2 kart, 240x180px):

┌──────────────────┐    ┌──────────────────┐
│                  │    │                  │
│   🏭  FABRİKA    │    │   🚛   ŞOFÖR     │
│                  │    │                  │
│  Yük ilanı oluş- │    │  İş bul, teklif  │
│  tur, tır bul    │    │  ver, para kazan │
└──────────────────┘    └──────────────────┘

Seçilen kart: --color-brand-500 border + hafif background
```

**Fabrika kayıt formu (adım 2):**
Şirket adı, vergi no, yetkili adı, e-posta, şifre, telefon

**Şoför kayıt formu (adım 2):**
Ad soyad, TCKN (AES ile şifrelenecek — "Güvenli saklanır 🔒" tooltip), e-posta, şifre, telefon

---

### 9.3 DASHBOARD (/dashboard) — FABRİKA

**Layout:** Sol sidebar (240px) + Ana içerik alanı

```
ÜSTTE — Hoşgeldin bar:
  "Günaydın, Mehmet Bey 👋" (Heading 3)
  "İzmir genelinde 14 aktif şoför uygun" (Body M, --color-neutral-400)
  [+ Yeni İlan Oluştur] Primary buton (sağda)

STAT KARTLARI (4'lü grid):
  📦 Aktif İlanlar      : 3
  🚛 Yolda Yükler       : 1
  ✅ Bu Ay Tamamlanan   : 12
  💰 Bu Ay Toplam (₺)  : ₺94.500

ORTA ALAN (2 kolon, %60 / %40):
  Sol: Son İlanlar tablosu
    Tablo kolonları: Güzergah | Araç | Durum | Fiyat | Tarih | Aksiyon
    Her satır hover'da highlight
    "Tümünü Gör" linki (sağda)
  
  Sağ: Canlı Aktivite akışı
    Gerçek zamanlı bildirimler (SignalR)
    "🚛 Hasan Çelik teklifinizi onayladı — 2 dk önce"
    "📍 Yük #1247 Eskişehir'e ulaştı — 15 dk önce"
    "💡 AI: ₺500 daha yüksek fiyat teklif edildi — 1 saat önce"
    Her item tıklanabilir → ilgili sayfaya git

ALT ALAN: Mini harita preview
  Aktif yüklerin konumunu gösteren kart
  "Canlı Takip" butonu → /loads/:id/track
```

---

### 9.4 YENİ İLAN OLUŞTUR (/loads/new)

**3 Adımlı Wizard — Üstte adım indikatörü**

```
ADIM 1 — GÜZERGAH & ZAMANLAMA
  
  İki büyük konum input (harita ikonu ile):
  
  [📍 Yükleme Noktası         ] [Haritadan Seç]
  [📍 Teslimat Noktası         ] [Haritadan Seç]
  
  Haritada seçilince: Mini harita açılır (400px yükseklik)
  Rota preview: İki nokta arası çizilmiş, mesafe gösterilir
  "847 km · Tahmini 9 saat 20 dk (OSRM)" (Body M, neutral-400)
  
  [📅 Yükleme Tarihi & Saati]
  
  [Devam →]

ADIM 2 — YÜK DETAYLARI
  
  Araç Tipi Seçici (horizontal scroll cards):
  [Tır 40t] [Kamyon 20t] [Frigorifik] [Lowboy] [Tanker]
  
  [Yük Türü        ] (tekstil, makine, gıda vb. dropdown)
  [Ağırlık (kg)    ]
  [Hacim (m³)      ] (opsiyonel)
  [Özel Notlar     ] (textarea)
  
  [← Geri]  [Devam →]

ADIM 3 — FİYATLANDIRMA (AI Destekli)
  
  AI Fiyat Analizi bileşeni (tam genişlik)
  [Taban fiyatınızı belirleyin] slider + input
  
  Özet kutusu (sağ kolon, sticky):
    Güzergah özeti
    Araç tipi
    Toplam fiyat (büyük, turuncu)
    [✅ İlanı Yayınla] Primary buton
    "Yayınlanan ilan şoförlere anında bildirilir"
```

---

### 9.5 İLAN DETAYI & TEKLİF YÖNETİMİ (/loads/:id)

**2 Kolon Layout (sol %55 / sağ %45)**

```
SOL — İlan Detayları:
  Durum Stepper (5 adım, animasyonlu)
  Güzergah kartı (mini harita embed)
  Yük detay bilgileri
  Zaman çizelgesi

SAĞ — Teklifler Paneli:
  "Gelen Teklifler (7)" header + sort dropdown
  
  Her teklif:
  ┌────────────────────────────────┐
  │ [Avatar] Hasan Çelik     ⭐4.9 │
  │ 🚛 34 ABC 1234  Tır 40t        │
  │ ₺13.200          AI: ₺12.500  │
  │ [Şoför Profilini Gör]          │
  │ [Onayla ✓]        [Reddet ✗]  │
  └────────────────────────────────┘
  
  "Onayla" tıklanınca → Confirm modal:
  "Hasan Çelik'in teklifini onaylıyorsunuz. 
   Diğer teklifler otomatik reddedilecek."
  [Evet, Onayla]  [İptal]
```

---

### 9.6 CANLI TAKİP (/loads/:id/track)

**Full-height harita (sidebar hariç tüm ekran)**

```
Üst bar (harita üstünde, şeffaf):
  Yük #1247 | İzmir → Ankara | 🟢 Yolda
  Tahmini varış: 14:30 (3 saat 20 dk)

Harita (tüm alan):
  - Çıkış noktası marker
  - Varış noktası marker
  - Rota çizgisi (turuncu)
  - Araç marker (anlık, canlı)

Sağ alt köşe — info kartı (320px, overlay):
  ┌──────────────────────────────┐
  │ Hasan Çelik · 34 ABC 1234   │
  │ Son konum: Uşak, 14:07       │
  │ Kalan mesafe: 312 km         │
  │ ETA: 14:30                   │
  │ [💬 Mesaj Gönder]            │
  └──────────────────────────────┘

Sol üst — harita kontrolleri:
  Zoom +/-, Satellite/Normal toggle, Konuma git
```

---

### 9.7 ADMİN PANELİ (/admin)

```
Ayrı layout (farklı sidebar rengi — --color-neutral-950, kırmızı aksan)

Sayfalar:
  /admin/dashboard     ← Sistem istatistikleri
  /admin/users         ← Kullanıcı yönetimi
  /admin/documents     ← Bekleyen evrak onayları (AI flagged)
  /admin/loads         ← Tüm ilanlar
  /admin/logs          ← Sistem logları

Belge Onay Ekranı:
  Sol: Belge görseli (PDF/JPG preview, büyük)
  Sağ: Gemini AI analiz sonucu detayları
       [✅ Onayla]  [⏸ Gri Alan — İncelemeye Al]  [❌ Reddet]
       Red sebebi dropdown (zorunlu)
```

---

## 10. Sayfa Detayları — Mobile (Flutter)

### 10.1 ONBOARDING (3 Slide)

```
Slide 1:
  Animasyonlu harita + tır ikonu (Lottie)
  "Yüklerin için en iyi şoförü bul"
  Alt nokta indikatörü + [Devam]

Slide 2:
  Animasyonlu fiyat karşılaştırması
  "AI ile adil fiyat, anlaşmazlık yok"

Slide 3:
  Animasyonlu belge tarama
  "Belgelerini bir kez yükle, güvenilir onayla çalış"
  [Hemen Başla] + [Zaten hesabım var]
```

---

### 10.2 ŞOFÖR — ANA SAYFA

```
Status bar: Koyu
Safe area top

ÜSTTE:
  "Merhaba, Hasan 👋" (Heading 3)
  [Konumum: İzmir] toggle (yeşil = aktif yayınlıyor)

HIZLI STAT SATIRI:
  Bugün: [3 ilan] [₺0 teklif] [1 aktif]

"Yakınındaki Yükler" başlığı + "Tümünü Gör"
İlan kartları (vertical scroll, LoadCard kompakt versiyonu)

Her kart:
  Tek swipe sağa → Hızlı Teklif Ver
  Tek swipe sola → Kaydet / Sonra Gör

FAB (+) butonu: Sağ alt, 56x56px, turuncu, yükseltilmiş
```

---

### 10.3 ŞOFÖR — İLAN DETAYI (MODAL/PUSH)

```
Bottom Sheet (draggable, %90 yükseklik)

Üst kısım: Harita preview (200px), rota çizgili
Handle bar (sürükle indikatörü)

GÜZERGAH:
  🔵 İZMİR, Kemalpaşa OSB
     |  847 km · ₺7.2/L mazot
  🔴 ANKARA, Ostim

YÜK BİLGİSİ:
  Büyük chip'ler: [🚛 Tır 40t] [⚖️ 18t] [📦 Tekstil]

FİYAT:
  AI Taban: ₺12.500 (mor badge ile)

TEKLİF VER ALANI:
  [₺ ____________] büyük input
  [Teklif Fiyatı Gir]
  AI önerisi: "₺12.500 = adil fiyat" (Body S, mor)

Sticky bottom:
  [Teklif Gönder →] Full-width Primary buton, 56px
```

---

### 10.4 ŞOFÖR — BELGE YÜKLEME

```
Her belge için ayrı kart:
  ┌──────────────────────────────┐
  │  📄 Sürücü Belgesi           │
  │  [Fotoğraf Çek] [Galeride Seç]│
  │  Durum: ✅ Onaylandı          │
  │  Bitiş: 12.05.2027           │
  └──────────────────────────────┘

Yükleme sonrası:
  Gemini analiz animasyonu (mor, spinny)
  Sonuç toast bildirimi
```

---

### 10.5 ŞOFÖR — AKTİF YÜK TAKİP

```
Full-screen harita (Google Maps / Mapbox)
Alt drawer (mini, 160px):
  Fabrika: Mehmet Bey / İzmir Tekstil
  ETA: 14:30 · 312 km kaldı
  [Teslimatı Tamamla] (varış noktasına <500m gelince aktif olur)
  [Mesaj] [Araç]

Teslimat butonu tıklanınca:
  QR kod kamerası açılır (yol haritası özelliği)
  ya da OTP kodu girişi
```

---

## 11. Etkileşim & Animasyon Rehberi

### Genel İlkeler
- Animasyonlar **amaçlı** olmalı: dikkat çekmek için değil, bağlam sağlamak için
- Default duration: **200ms** (micro), **300ms** (standard), **400ms** (page transition)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` — Material Design standard ease
- `prefers-reduced-motion: reduce` aktifken tüm animasyonlar kapatılmalı

### Spesifik Animasyonlar

```
Sayfa geçişi (web)     : Fade + slide Y 8px, 300ms
Modal aç               : Scale 0.95→1.0 + fade, 200ms
Bottom sheet aç        : Slide up Y, spring (0.175, 0.885, 0.32, 1.275)
Toast                  : Slide in + fade, 250ms / slide out + fade, 200ms
Buton hover            : translateY(-1px) + shadow artış, 150ms
Buton active/press     : Scale 0.97 + translateY(0), 100ms
Kart hover             : translateY(-2px) + border brightness, 200ms
AI analiz              : Mor gradient shimmer / rotating sparkles Lottie
Canlı konum marker     : Süzülme hareketi (position interpolation, 3s)
Yük durumu pulse       : Radial pulse animasyonu (yeşil aktif için), 2s loop
Teklif geldi           : Sayaç +1 animasyonu (flip), 400ms
Loading skeleton       : Shimmer soldan sağa, 1500ms loop
```

### Micro-interactions
- Form input focus: Etiket yukarı sıçrar (label float)
- Toggle aktif: Thumb spring, ses opsiyonel (vibration mobile)
- Teklif onaylandı: Konfetti efekti (canvas-confetti, 2 saniye)
- Konum izni verildi: Harita yakınlaşır kullanıcı konumuna

---

## 12. Responsive Breakpoints

```
Mobile S    : 320px — 479px  (küçük Android)
Mobile L    : 480px — 767px  (büyük Android, iPhone Max)
Tablet      : 768px — 1023px (iPad)
Desktop S   : 1024px — 1279px (laptop)
Desktop M   : 1280px — 1535px (standart masaüstü) ← PRIMARY TARGET
Desktop L   : 1536px+        (geniş ekran)
```

### Layout Değişimleri
```
Mobile (<768px):
  - Bottom navigation (sidebar yok)
  - Tüm kartlar full-width
  - Grid 1 kolon
  - Harita modal/fullscreen

Tablet (768-1023px):
  - Sidebar collapse (64px)
  - Grid 2 kolon
  - Bottom sheet yerine side drawer

Desktop (1024px+):
  - Sidebar 240px expanded
  - Grid 3-4 kolon (stat cards)
  - Harita inline (split view)
  - Hover state'ler aktif
```

### Dokunma Hedefi Minimumları
- Mobile'da tüm tıklanabilir alan minimum **44x44px** (Apple HIG)
- Critical aksiyonlar (Teklif Gönder, Onayla) minimum **56px yükseklik**
- İki buton arasındaki boşluk minimum **8px**

---

## 13. Erişilebilirlik (A11y) Gereksinimleri

### Kontrast Oranları
```
Normal metin (18px altı)   : Minimum 4.5:1 (WCAG AA)
Büyük metin (18px üzeri)   : Minimum 3:1
UI bileşenleri (border vb) : Minimum 3:1
Tercih edilen hedef        : 7:1 (AAA) ana metin için
```

### Önemli Kontrastlar (Kontrol Et)
```
Turuncu (#FF6B00) üzerine beyaz   : ~3.2:1 ⚠️ Sadece büyük metin OK
Turuncu (#FF6B00) üzerine siyah   : ~5.1:1 ✅ Normal metin OK
--neutral-300 üzerine --neutral-950: ~11.5:1 ✅
```

### Klavye Navigasyonu
- Tüm interaktif elementler `Tab` ile erişilebilir olmalı
- Focus ring: 3px solid --color-brand-500, offset 2px (outline hiçbir zaman kaldırılmaz)
- Modal açıldığında focus trap içinde kalmalı
- `Escape` her zaman modal/dropdown kapatmalı

### Semantik HTML & ARIA
- Navigation: `<nav>`, `<ul>`, `<li>` yapısı
- Formlar: `<label for="">` bağlı, `aria-required`, `aria-describedby` error için
- Harita: `aria-label="Yük takip haritası"`, zoom kontrolleri aria-label'lı
- Loading: `aria-live="polite"` + `aria-busy="true"`
- Badge sayaçlar: `aria-label="7 okunmamış bildirim"`
- Durum renkleri: Sadece renge dayanmayan, ikon + metin de içeren gösterim

---

## 14. Figma Dosya Organizasyonu

### Önerilen Sayfa Yapısı

```
📁 YUKLE Design System
  📄 Cover (thumbnail)
  📄 🎨 Foundations (Colors, Typography, Spacing, Icons)
  📄 🧩 Components (Buttons, Forms, Cards, Navigation...)
  📄 🌑 Dark Mode Preview
  📄 ☀️ Light Mode Preview

📁 Web App
  📄 🔐 Auth (Login, Register, Reset)
  📄 🏭 Factory — Dashboard
  📄 🏭 Factory — Load Management
  📄 🏭 Factory — Bid Management
  📄 🗺️ Live Tracking
  📄 👤 Profile & Settings
  📄 🛡️ Admin Panel

📁 Mobile App (Flutter)
  📄 📱 Onboarding
  📄 🚛 Driver — Home
  📄 🚛 Driver — Load Detail
  📄 🚛 Driver — Documents
  📄 🚛 Driver — Active Tracking
  📄 🚛 Driver — Profile & Earnings

📁 Prototype Flows
  📄 Flow 1: Fabrika — İlan Oluştur → Teklif Onayla
  📄 Flow 2: Şoför — İlan Bul → Teklif Ver
  📄 Flow 3: Onboarding
```

### Naming Convention
```
Komponent frame  : [Komponent/Variant/State] — örn: Button/Primary/Hover
Sayfa frame      : [Platform/Sayfa] — örn: Web/Dashboard, Mobile/Home
Renk stilnleri   : brand/500, neutral/800, status/success
Text stilleri    : heading/1, body/large, label/medium
```

### Auto Layout Kuralları
- Tüm componentlerde Auto Layout kullan (sabit boyut hariç)
- Padding: `space-{n}` token ile eşleşmeli
- Nestlenmiş Auto Layout: Yatay içinde dikey tercih et

---

## SON NOTLAR — TASARIMCIYA

Bu brief, uygulamanın **teknik gerçekliğine** dayanmaktadır:
- Backend hazır: JWT, SignalR, AI fiyatlama, PostGIS
- Tasarımın **canlı veri** ile çalışacağını varsay (skeleton loader'lar zorunlu)
- Şoför evrak onay akışı kritik — Gemini AI durumunu net göster
- Türk kullanıcılar için: TL para birimi ₺ sembolü, tarih formatı **GG.AA.YYYY**
- KVKK uyumu: TCKN ve hassas bilgi alanlarında "🔒 Güvenli saklanır" göstergesi
- Dark mode **birincil** tasarım — light mode ikincil (tema seçeneği sunulacak)
- Fontlar: Google Fonts üzerinden yüklenir, lisans sorunu yok

**Teslimat Beklentisi:**
1. Design System sayfası (tokenlar + componentler)
2. Web — Tüm sayfalar Desktop 1440px'de (dark mode)
3. Mobile — Tüm ekranlar 390x844px (iPhone 14 Pro)
4. Prototype: En az 2 temel user flow tıklanabilir
5. Export: Component'lar için iOS/Android/Web için asset export hazır

---

*YÜK-LE Design Brief · v1.0 · Hazırlayan: Hilmi Salih Altınışık · 2026*
