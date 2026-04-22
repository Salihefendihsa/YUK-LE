using System;

namespace Yukle.Api.Models;

public class Vehicle
{
    // Kimlik & İlişki
    public int Id { get; set; }
    public int DriverId { get; set; }
    public User Driver { get; set; } = null!;

    // Fiziksel Özellikler
    public string Plate { get; set; } = string.Empty;
    public VehicleType Type { get; set; }
    public double Capacity { get; set; }

    // Operasyonel Veriler
    public bool IsActive { get; set; } = true;
    public DateTime? LastMaintenanceDate { get; set; }
}
