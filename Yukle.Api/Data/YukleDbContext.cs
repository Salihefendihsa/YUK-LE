using Microsoft.EntityFrameworkCore;
using Yukle.Api.Models;

namespace Yukle.Api.Data;

public class YukleDbContext : DbContext
{
    public YukleDbContext(DbContextOptions<YukleDbContext> options) : base(options)
    {
    }

    public DbSet<Load> Loads { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map spatial functions
        modelBuilder.HasPostgresExtension("postgis");

        // GIST Indexes for Spatial Data as requested
        modelBuilder.Entity<Load>()
            .HasIndex(l => l.OriginLocation)
            .HasMethod("GIST");

        modelBuilder.Entity<Load>()
            .HasIndex(l => l.DestinationLocation)
            .HasMethod("GIST");
    }
}
