using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Api.Data;

public class YukleDbContext : DbContext
{
    // v2.5.5 — KVKK AES-256 şifreleme için singleton servis.
    // ValueConverter OnModelCreating içinde construct edildiğinde bu delegate'i
    // yakalar; DbContext cache'lenen modelle birlikte aynı servis referansını kullanır.
    private readonly IEncryptionService _encryptionService;

    public YukleDbContext(
        DbContextOptions<YukleDbContext> options,
        IEncryptionService               encryptionService)
        : base(options)
    {
        _encryptionService = encryptionService;
    }

    public DbSet<User>         Users         { get; set; }
    public DbSet<Load>         Loads         { get; set; }
    public DbSet<Vehicle>      Vehicles      { get; set; }
    public DbSet<Bid>          Bids          { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Rating> Ratings { get; set; }
    public DbSet<DeliveryAddress> DeliveryAddresses { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<FuelPrice>    FuelPrices    { get; set; }
    public DbSet<AdminActionLog> AdminActionLogs { get; set; }

    // Faz 4: Ticaret ve Yasal Log
    public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
    public DbSet<WalletAuditLog>     WalletAuditLogs     { get; set; }
    public DbSet<UetdsOutbox>        UetdsOutboxes       { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── v2.5.5 · KVKK AES-256 Value Converters ───────────────────────────
        //
        // Bu converter'lar ilgili alanların DB'ye yazılırken otomatik olarak
        // Encrypt edilmesini, okunurken otomatik olarak Decrypt edilmesini sağlar.
        // Deterministik IV sayesinde aynı değer daima aynı ciphertext üretir.
        //
        // Fallback güvenliği: Decrypt() base64 olmayan (migration öncesi legacy)
        // verilerle karşılaşırsa CryptographicException'ı yakalar ve plaintext döndürür.
        // Bu sayede migration sırasında veri kaybı yaşanmaz.
        //
        // Güvenlik notu: Anahtar yalnızca config'ten okunur; bellekte saklanır, DB'ye
        // kesinlikle sızmaz. DB kaçağı durumunda şifreli kolonlar anahtarsız anlamsızdır.

        // TCKN — vergi kimlik / TC kimlik numarası
        var tcknEncryptionConverter = new ValueConverter<string, string>(
            plainText  => _encryptionService.Encrypt(plainText)  ?? string.Empty,
            cipherText => _encryptionService.Decrypt(cipherText) ?? string.Empty);

        // FullName — Ad-Soyad (KVKK Madde 6: kimliği belirleyici kişisel veri)
        var fullNameEncryptionConverter = new ValueConverter<string, string>(
            plainText  => _encryptionService.Encrypt(plainText)  ?? string.Empty,
            cipherText => _encryptionService.Decrypt(cipherText) ?? string.Empty);

        // Phone — Telefon numarası (KVKK Madde 6: iletişim verisi)
        var phoneEncryptionConverter = new ValueConverter<string, string>(
            plainText  => _encryptionService.Encrypt(plainText)  ?? string.Empty,
            cipherText => _encryptionService.Decrypt(cipherText) ?? string.Empty);

        // ── User ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Phone).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.WalletBalance).HasPrecision(18, 2);
            entity.Property(u => u.PendingBalance).HasPrecision(18, 2);

            // KVKK: Hassas PII alanları AES-256-CBC ile şifreli saklanır.
            // Base64 ciphertext TCKN için ~44, isim/telefon için ~64-88 karakter;
            // text kolonu maksimum uzunluk kısıtı olmaksızın her boyutu karşılar.
            entity.Property(u => u.TaxNumberOrTCKN)
                  .HasConversion(tcknEncryptionConverter);

            // Phase 2.3: Ad-Soyad şifrelemesi (KVKK uyumu genişletmesi)
            entity.Property(u => u.FullName)
                  .HasConversion(fullNameEncryptionConverter);

            // Phase 2.3: Telefon numarası şifrelemesi (KVKK uyumu genişletmesi)
            // Dikkat: IsUnique() index şifreli değer üzerinde çalışır → deterministik
            // IV sayesinde aynı numara daima aynı ciphertext üretir, unique kısıt korunur.
            entity.Property(u => u.Phone)
                  .HasConversion(phoneEncryptionConverter);

            // ── v2.5.6 · Admin Dashboard "Bekleyen Onaylar" Kuyruğu İndeksi ──
            //
            // Faz 4.5.5'te admin paneli şu sorguyu yapacak:
            //   SELECT * FROM users
            //   WHERE role = 1 /* Driver */ AND approvalstatus IN (4, 5)
            //   ORDER BY createdat ASC;
            //
            // (4 = ManualApprovalRequired, 5 = PendingReview)
            // Aşağıdaki bileşik index bu queue sorgusu için sıralı I/O sağlar.
            // Küçük kardinaliteli (Role) + filtrelenebilir (ApprovalStatus) alan dizilimi
            // PostgreSQL'de optimal seek yapısı oluşturur.
            entity.HasIndex(u => new { u.Role, u.ApprovalStatus })
                  .HasDatabaseName("IX_Users_Role_ApprovalStatus");

            // AiInferenceDetails potansiyel olarak uzun JSON içerir; explicit text tipi,
            // PostgreSQL varchar(max) yerine native text kolonunu zorlar.
            entity.Property(u => u.AiInferenceDetails).HasColumnType("text");
            entity.Property(u => u.AdminReviewNote).HasMaxLength(500);
            entity.Property(u => u.HomeAddress).HasMaxLength(500);
            entity.Property(u => u.BankIban).HasMaxLength(34);
        });

        // ── Load ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<Load>(entity =>
        {
            entity.HasKey(l => l.Id);

            // Owner: Zorunlu, silinirse yük da silinir
            entity.HasOne(l => l.Owner)
                  .WithMany(u => u.OwnedLoads)
                  .HasForeignKey(l => l.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Driver: Opsiyonel atama (kısıtlı silme)
            entity.HasOne(l => l.Driver)
                  .WithMany(u => u.CarriedLoads)
                  .HasForeignKey(l => l.DriverId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Vehicle: Opsiyonel atama (null bırak)
            entity.HasOne(l => l.Vehicle)
                  .WithMany()
                  .HasForeignKey(l => l.VehicleId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Finansal hassasiyet
            entity.Property(l => l.Price).HasPrecision(18, 2);

            // AI fiyat analizi alanları
            entity.Property(l => l.AiSuggestedPrice).HasPrecision(18, 2);
            entity.Property(l => l.AiMinPrice).HasPrecision(18, 2);
            entity.Property(l => l.AiMaxPrice).HasPrecision(18, 2);

            // Para birimi varsayılanı
            entity.Property(l => l.Currency)
                  .HasMaxLength(3)
                  .HasDefaultValue("TRY");

            // Rota alanları
            entity.Property(l => l.FromCity).HasMaxLength(100).IsRequired();
            entity.Property(l => l.FromDistrict).HasMaxLength(100).IsRequired();
            entity.Property(l => l.ToCity).HasMaxLength(100).IsRequired();
            entity.Property(l => l.ToDistrict).HasMaxLength(100).IsRequired();

            // PostGIS coğrafi noktalar — geometry(Point, 4326)
            entity.Property(l => l.Origin)
                  .HasColumnType("geometry(Point, 4326)")
                  .IsRequired();

            entity.Property(l => l.Destination)
                  .HasColumnType("geometry(Point, 4326)")
                  .IsRequired();
        });

        // ── Vehicle ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasOne(v => v.Driver)
                  .WithMany(u => u.Vehicles)
                  .HasForeignKey(v => v.DriverId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(v => v.Plate).IsUnique();
            entity.Property(v => v.Plate).IsRequired();
        });

        // ── Bid ───────────────────────────────────────────────────────────────
        modelBuilder.Entity<Bid>(entity =>
        {
            entity.HasOne(b => b.Load)
                  .WithMany(l => l.Bids)
                  .HasForeignKey(b => b.LoadId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Driver)
                  .WithMany(u => u.Bids)
                  .HasForeignKey(b => b.DriverId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(b => b.Amount).HasPrecision(18, 2);
        });

        // ── Notification ──────────────────────────────────────────────────────
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasOne(n => n.User)
                  .WithMany()
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(n => n.Title).HasMaxLength(200).IsRequired();
            entity.Property(n => n.Message).HasMaxLength(1000).IsRequired();

            // Okunmamış bildirimleri hızlı getirmek için bileşik index
            entity.HasIndex(n => new { n.UserId, n.IsRead });
        });

        modelBuilder.Entity<Rating>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Comment).HasMaxLength(500);
            entity.HasOne(r => r.Load).WithMany().HasForeignKey(r => r.LoadId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.GivenByUser).WithMany().HasForeignKey(r => r.GivenByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(r => r.GivenToUser).WithMany().HasForeignKey(r => r.GivenToUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(r => new { r.LoadId, r.GivenByUserId }).IsUnique();
        });

        modelBuilder.Entity<DeliveryAddress>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Title).HasMaxLength(100).IsRequired();
            entity.Property(d => d.CompanyName).HasMaxLength(200).IsRequired();
            entity.Property(d => d.ContactPerson).HasMaxLength(150).IsRequired();
            entity.Property(d => d.ContactPhone).HasMaxLength(20).IsRequired();
            entity.Property(d => d.Address).HasMaxLength(500).IsRequired();
            entity.Property(d => d.City).HasMaxLength(100).IsRequired();
            entity.Property(d => d.District).HasMaxLength(100).IsRequired();
            entity.HasOne(d => d.User).WithMany().HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.SenderName).HasMaxLength(150).IsRequired();
            entity.Property(c => c.SenderRole).HasMaxLength(32).IsRequired();
            entity.Property(c => c.Message).HasMaxLength(2000).IsRequired();
            entity.Property(c => c.BlockReason).HasMaxLength(300);
            entity.HasIndex(c => new { c.LoadId, c.CreatedAt });
        });

        // ── AdminActionLog ────────────────────────────────────────────────────
        modelBuilder.Entity<AdminActionLog>(entity =>
        {
            entity.HasKey(a => a.Id);

            // İşlemi yapan Admin (Silinirse log tutulsun, restrict vb.)
            // Çoklu cascade'i önlemek için Restrict/NoAction kullanıyoruz
            entity.HasOne(a => a.Admin)
                  .WithMany()
                  .HasForeignKey(a => a.AdminId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.TargetUser)
                  .WithMany()
                  .HasForeignKey(a => a.TargetUserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(a => a.Action).HasMaxLength(50).IsRequired();
            entity.Property(a => a.Note).HasMaxLength(1000);
            entity.HasIndex(a => a.TimestampUtc);
        });

        // ── FuelPrice ─────────────────────────────────────────────────────────
        modelBuilder.Entity<FuelPrice>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.City).HasMaxLength(100).IsRequired();
            entity.Property(f => f.PriceTL).HasPrecision(10, 4);
            entity.Property(f => f.Source).HasMaxLength(50);

            // En güncel il+yakıt türü fiyatını hızlı getirmek için bileşik index
            entity.HasIndex(f => new { f.City, f.FuelType, f.Date });
        });

        // ── Phase 4.1 PaymentTransaction ──────────────────────────────────────
        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasOne(p => p.Load)
                  .WithMany()
                  .HasForeignKey(p => p.LoadId)
                  .OnDelete(DeleteBehavior.Restrict); // Yük silinse dahi ödeme kaydı kalsın

            entity.Property(p => p.TransactionId).HasMaxLength(100);
            entity.Property(p => p.Amount).HasPrecision(18, 4);
        });

        // ── WalletAuditLog ────────────────────────────────────────────────────
        modelBuilder.Entity<WalletAuditLog>(entity =>
        {
            entity.HasKey(w => w.Id);
            entity.Property(w => w.Amount).HasPrecision(18, 2);
            entity.Property(w => w.BalanceBefore).HasPrecision(18, 2);
            entity.Property(w => w.BalanceAfter).HasPrecision(18, 2);
            entity.Property(w => w.Reason).HasMaxLength(500);
            entity.HasIndex(w => new { w.UserId, w.CreatedAt });
            entity.HasIndex(w => w.LoadId);
        });

        // ── Phase 4.3 UetdsOutbox ─────────────────────────────────────────────
        modelBuilder.Entity<UetdsOutbox>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.HasOne(o => o.Load)
                  .WithMany()
                  .HasForeignKey(o => o.LoadId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(o => o.LastErrorMessage).HasMaxLength(1000);
        });
    }
}
