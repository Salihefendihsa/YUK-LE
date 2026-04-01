using Microsoft.EntityFrameworkCore;
using Yukle.Api.Models;

namespace Yukle.Api.Data;

public class YukleDbContext : DbContext
{
    public YukleDbContext(DbContextOptions<YukleDbContext> options) : base(options)
    {
    }

    public DbSet<Load> Loads { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<Bid> Bids { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map spatial functions
        modelBuilder.HasPostgresExtension("postgis");

        // User Entity Rules
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Phone).IsUnique();
            entity.Property(u => u.WalletBalance).HasPrecision(18, 2);
            entity.Property(u => u.PendingBalance).HasPrecision(18, 2);
        });

        // Vehicle Entity Rules
        modelBuilder.Entity<Vehicle>(entity =>
        {
            // 1-to-Many: Bir Driver'ın birçok aracı olabilir, ama bir araç bir Driver'a aittir
            entity.HasOne(v => v.Driver)
                  .WithMany(u => u.Vehicles)
                  .HasForeignKey(v => v.DriverId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Plaka benzersiz ve zorunlu
            entity.HasIndex(v => v.Plate).IsUnique();
            entity.Property(v => v.Plate).IsRequired();
        });

        // Load Entity Rules
        modelBuilder.Entity<Load>(entity =>
        {
            // İlişkiler: Owner (zorunlu), Driver (opsiyonel), Vehicle (opsiyonel)
            entity.HasOne(l => l.Owner)
                  .WithMany(u => u.OwnedLoads)
                  .HasForeignKey(l => l.OwnerId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.Driver)
                  .WithMany(u => u.CarriedLoads)
                  .HasForeignKey(l => l.DriverId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(l => l.Vehicle)
                  .WithMany()
                  .HasForeignKey(l => l.VehicleId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Mekânsal Kolonlar: SRID 4326 (WGS 84 - Standart GPS) zorunlu kılınması
            // HasColumnType "geometry (point, 4326)" ile SRID veritabanı seviyesinde mühürlenir
            entity.Property(l => l.Origin)
                  .HasColumnType("geometry (point, 4326)")
                  .IsRequired();
            entity.Property(l => l.Destination)
                  .HasColumnType("geometry (point, 4326)")
                  .IsRequired();

            // GIST Indexleri (Mekânsal Sorgu Performansı)
            entity.HasIndex(l => l.Origin).HasMethod("GIST");
            entity.HasIndex(l => l.Destination).HasMethod("GIST");

            // Finansal Hassasiyet
            entity.Property(l => l.Weight).HasPrecision(18, 2);
            entity.Property(l => l.Volume).HasPrecision(18, 2);
            entity.Property(l => l.Price).HasPrecision(18, 2);
        });

        // Bid Entity Rules
        modelBuilder.Entity<Bid>(entity =>
        {
            // 1-to-Many: Bir Load'un birçok Bid'i olabilir
            entity.HasOne(b => b.Load)
                  .WithMany(l => l.Bids)
                  .HasForeignKey(b => b.LoadId)
                  .OnDelete(DeleteBehavior.Cascade);

            // 1-to-Many: Bir Driver birçok Bid verebilir
            entity.HasOne(b => b.Driver)
                  .WithMany(u => u.Bids)
                  .HasForeignKey(b => b.DriverId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Finansal Hassasiyet
            entity.Property(b => b.Amount).HasPrecision(18, 2);
        });
    }
}
