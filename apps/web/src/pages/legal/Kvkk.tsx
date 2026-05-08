export default function KvkkPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#090B0E', color: '#E5E7EB', padding: '32px 16px' }}>
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
        <h1 style={{ marginBottom: 8 }}>YÜK-LE KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK)</h1>
        <h2 style={{ fontSize: 18, marginBottom: 20 }}>AYDINLATMA METNİ</h2>

        <p><strong>1. Veri Sorumlusu</strong><br />YÜK-LE Lojistik Teknolojileri A.Ş. olarak...</p>

        <p><strong>2. İşlenen Kişisel Veriler</strong></p>
        <ul>
          <li>Kimlik verileri: Ad, soyad, T.C. kimlik numarası</li>
          <li>İletişim verileri: Telefon, e-posta, adres</li>
          <li>Finansal veriler: IBAN, vergi numarası, cüzdan bakiyesi</li>
          <li>Mesleki veriler: Sürücü belgesi, SRC belgesi, araç bilgileri</li>
          <li>Konum verileri: Anlık GPS koordinatları (aktif sefer sırasında)</li>
          <li>İşlem verileri: Yük ilanları, teklifler, teslimat kayıtları</li>
        </ul>

        <p><strong>3. Kişisel Verilerin İşlenme Amaçları</strong></p>
        <ul>
          <li>Platform üyeliği ve kimlik doğrulama</li>
          <li>Yük-şoför eşleştirme hizmetinin sunulması</li>
          <li>Ödeme ve faturalama işlemlerinin gerçekleştirilmesi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi (U-ETDS bildirimleri)</li>
          <li>Güvenlik ve doğrulama işlemleri</li>
          <li>Platform iyileştirme ve analiz</li>
        </ul>

        <p><strong>4. Kişisel Verilerin Aktarıldığı Taraflar</strong></p>
        <ul>
          <li>İyzico Ödeme Hizmetleri (ödeme işlemleri için)</li>
          <li>Ulaştırma ve Altyapı Bakanlığı (U-ETDS bildirimleri için)</li>
          <li>NetGSM (SMS doğrulama için)</li>
          <li>Google Firebase (push bildirimler için)</li>
        </ul>

        <p><strong>5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</strong><br />
          Kişisel verileriniz platform üzerinden dijital olarak toplanmaktadır. İşlemenin hukuki dayanakları:
        </p>
        <ul>
          <li>Sözleşmenin kurulması ve ifası</li>
          <li>Yasal yükümlülük</li>
          <li>Meşru menfaat</li>
          <li>Açık rıza</li>
        </ul>

        <p><strong>6. KVKK Kapsamındaki Haklarınız</strong></p>
        <ul>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış işlenmiş ise düzeltilmesini isteme</li>
          <li>Silinmesini veya yok edilmesini isteme</li>
          <li>Otomatik sistemler vasıtasıyla aleyhinize sonuç doğurmasına itiraz etme</li>
          <li>Zararın giderilmesini talep etme</li>
        </ul>

        <p><strong>7. İletişim</strong><br />KVKK haklarınız için: kvkk@yük-le.com</p>
      </div>
    </div>
  )
}
