using Microsoft.EntityFrameworkCore;
using Yukle.Api.Models;

namespace Yukle.Api.Data;

public class YukleDbContext : DbContext
{
    public YukleDbContext(DbContextOptions<YukleDbContext> options) : base(options) { }

    public DbSet<User>         Users         { get; set; }
    public DbSet<Load>         Loads         { get; set; }
    public DbSet<Vehicle>      Vehicles      { get; set; }
    public DbSet<Bid>          Bids          { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<FuelPrice>    FuelPrices    { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ──────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Phone).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.WalletBalance).HasPrecision(18, 2);
            entity.Property(u => u.PendingBalance).HasPrecision(18, 2);
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
    }
}
