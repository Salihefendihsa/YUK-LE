import Footer from '../../components/layout/Footer'

export default function KullanimKosullariPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#090B0E', color: '#E5E7EB', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '32px 16px' }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            background: '#1C2029',
            border: '1px solid #272D3A',
            borderRadius: 14,
            padding: 24,
          }}
        >
          <h1 style={{ marginBottom: 20 }}>YÜK-LE KULLANIM KOŞULLARI</h1>

        <p><strong>1. Taraflar ve Kapsam</strong><br />
          YÜK-LE platformu; yük sahipleri (fabrika/müşteri) ile tır/kamyon şoförlerini dijital olarak buluşturan bir
          B2B lojistik pazaryeridir.
        </p>

        <p><strong>2. Üyelik Koşulları</strong></p>
        <ul>
          <li>18 yaşını doldurmuş olmak</li>
          <li>Gerçek ve güncel bilgi vermek</li>
          <li>Şoförler için geçerli sürücü belgesi ve SRC belgesi</li>
          <li>Fabrikalar için geçerli vergi kaydı</li>
        </ul>

        <p><strong>3. Şoförlerin Yükümlülükleri</strong></p>
        <ul>
          <li>Belgelerin güncel ve geçerli olması</li>
          <li>Anlaşılan yükü zamanında teslim etmek</li>
          <li>Yük güvenliğini sağlamak</li>
          <li>Konum paylaşımını aktif tutmak (aktif sefer sırasında)</li>
          <li>U-ETDS bildirimlerine rıza göstermek</li>
        </ul>

        <p><strong>4. Yük Sahiplerinin Yükümlülükleri</strong></p>
        <ul>
          <li>Yük bilgilerini doğru ve eksiksiz girmek</li>
          <li>Anlaşılan fiyatı ödemek</li>
          <li>Yükü belirtilen sürede hazır tutmak</li>
          <li>Teslimat adresini doğru bildirmek</li>
        </ul>

        <p><strong>5. Ödeme ve Komisyon</strong></p>
        <ul>
          <li>Tüm ödemeler YÜK-LE güvenli havuzu (escrow) üzerinden</li>
          <li>Platform komisyonu: %10</li>
          <li>Bireysel şoförler için stopaj kesintisi uygulanabilir</li>
          <li>Ödemeler teslimat onayından sonra serbest bırakılır</li>
        </ul>

        <p><strong>6. İptal ve İade Politikası</strong></p>
        <ul>
          <li>Şoför yola çıkmadan önce iptal: %100 iade</li>
          <li>Şoför yola çıktıktan sonra iptal: %15 cayma bedeli</li>
          <li>Teslimat noktasına 500m yaklaşıldıktan sonra iptal: Boşa gitme bedeli uygulanır</li>
        </ul>

        <p><strong>7. Yasaklı Faaliyetler</strong></p>
        <ul>
          <li>Sahte belge yüklemek</li>
          <li>Gerçek dışı ilan vermek</li>
          <li>Platform dışı ödeme yapmak</li>
          <li>Hesap bilgilerini paylaşmak</li>
        </ul>

        <p><strong>8. Sorumluluk Sınırlaması</strong><br />
          YÜK-LE bir aracı platform olup taşıma işleminden doğrudan sorumlu değildir. Taşımacılık sorumluluğu anlaşma
          yapan şoför ve yük sahibine aittir.
        </p>

        <p><strong>9. Uyuşmazlık Çözümü</strong><br />
          Taraflar arasındaki uyuşmazlıklarda Türk hukuku uygulanır. Yetkili mahkeme: Elazığ Mahkemeleri.
        </p>

        <p><strong>10. Değişiklikler</strong><br />
          YÜK-LE bu koşulları önceden bildirerek değiştirme hakkını saklı tutar.
        </p>

          <p>Son güncelleme: Mayıs 2026</p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
