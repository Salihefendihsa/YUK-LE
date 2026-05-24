namespace Yukle.Api.DTOs;

/// <summary>PUT /api/Users/{id} birleşik gövde — rol bazlı alanlar uygulanır.</summary>
public sealed class UpdateUserProfileRequest
{
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Ad soyad zorunludur.")]
    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "E-posta zorunludur.")]
    [System.ComponentModel.DataAnnotations.EmailAddress]
    public string Email { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.StringLength(200)]
    public string? CompanyName { get; set; }

    [System.ComponentModel.DataAnnotations.StringLength(500)]
    public string? CompanyAddress { get; set; }

    [System.ComponentModel.DataAnnotations.StringLength(34)]
    public string? Iban { get; set; }

    [System.ComponentModel.DataAnnotations.StringLength(500)]
    public string? HomeAddress { get; set; }
}

public sealed class UserProfileResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? TaxNumber { get; set; }
    public string? CompanyAddress { get; set; }
    public string? TcIdentityNumber { get; set; }
    public string? Iban { get; set; }
    public string? LicenseClass { get; set; }
    public string? HomeAddress { get; set; }
    public string? VehiclePlate { get; set; }
    public string? VehicleType { get; set; }
    public double AverageRating { get; set; }
    public int TotalRatingCount { get; set; }
    public string Role { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = string.Empty;
    public bool? IsDriverLicenseApproved { get; set; }
    public bool? IsSrcApproved { get; set; }
    public bool? IsPsychotechnicalApproved { get; set; }
    public string? LastValidationMessage { get; set; }
}

public sealed record UpdateFcmTokenRequest(string Token);
