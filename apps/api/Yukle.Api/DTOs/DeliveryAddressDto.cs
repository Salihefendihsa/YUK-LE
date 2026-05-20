using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

public sealed class UpsertDeliveryAddressDto
{
    [Required, StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [StringLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [StringLength(100)]
    public string ContactPerson { get; set; } = string.Empty;

    [StringLength(20)]
    public string ContactPhone { get; set; } = string.Empty;

    [Required, StringLength(500)]
    public string Address { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string City { get; set; } = string.Empty;

    [StringLength(100)]
    public string District { get; set; } = string.Empty;

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsDefault { get; set; }
}
