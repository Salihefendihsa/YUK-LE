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
                  .WithMany()
                  .HasForeignKey(v => v.DriverId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Plaka benzersiz ve zorunlu
            entity.HasIndex(v => v.Plate).IsUnique();
            entity.Property(v => v.Plate).IsRequired();
        });

        // GIST Indexes for Spatial Data as requested
        modelBuilder.Entity<Load>()
            .HasIndex(l => l.OriginLocation)
            .HasMethod("GIST");

        modelBuilder.Entity<Load>()
            .HasIndex(l => l.DestinationLocation)
            .HasMethod("GIST");
    }
}
