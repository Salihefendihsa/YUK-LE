using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Yukle.Api.DTOs
{
    public class UserRegisterDto : IValidatableObject
    {
        [Required(ErrorMessage = "Ad Soyad alanı zorunludur.")]
        [StringLength(100, ErrorMessage = "Ad Soyad en fazla 100 karakter olabilir.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Telefon numarası zorunludur.")]
        [RegularExpression(@"^\d{10,15}$", ErrorMessage = "Lütfen geçerli bir telefon numarası giriniz (sadece rakamlar, 10-15 hane arası).")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-posta adresi zorunludur.")]
        [EmailAddress(ErrorMessage = "Lütfen geçerli bir e-posta adresi giriniz.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur.")]
        [MinLength(8, ErrorMessage = "Şifre en az 8 karakter olmalıdır.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Rol alanı zorunludur.")]
        public string Role { get; set; } = "Customer"; // Beklenen Değerler: Customer, Driver

        public bool IsCorporate { get; set; }

        public string CompanyName { get; set; } = string.Empty;
        public string TaxNumber { get; set; } = string.Empty;
        public string CompanyAddress { get; set; } = string.Empty;
        public string TcIdentityNumber { get; set; } = string.Empty;
        public DateTime? BirthDate { get; set; }
        public string Iban { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string LicenseClass { get; set; } = string.Empty;
        public bool AcceptedKvkk { get; set; }
        public bool AcceptedTerms { get; set; }
        public bool AcceptedLocationTracking { get; set; }
        public string TaxNumberOrTCKN { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            bool isCustomer = string.Equals(Role, "Customer", StringComparison.OrdinalIgnoreCase);
            bool isDriver = string.Equals(Role, "Driver", StringComparison.OrdinalIgnoreCase);

            if (!AcceptedKvkk)
                yield return new ValidationResult("KVKK onayı zorunludur.", [nameof(AcceptedKvkk)]);
            if (!AcceptedTerms)
                yield return new ValidationResult("Kullanım koşulları onayı zorunludur.", [nameof(AcceptedTerms)]);

            if (isCustomer)
            {
                if (string.IsNullOrWhiteSpace(CompanyName) || CompanyName.Trim().Length < 2)
                    yield return new ValidationResult("Şirket adı zorunludur ve en az 2 karakter olmalıdır.", [nameof(CompanyName)]);
                if (!Regex.IsMatch(TaxNumber ?? "", @"^\d{10}$"))
                    yield return new ValidationResult("Vergi numarası tam 10 hane olmalıdır.", [nameof(TaxNumber)]);
                if (string.IsNullOrWhiteSpace(CompanyAddress) || CompanyAddress.Trim().Length < 10)
                    yield return new ValidationResult("Şirket adresi zorunludur ve en az 10 karakter olmalıdır.", [nameof(CompanyAddress)]);
            }

            if (isDriver)
            {
                if (!Regex.IsMatch(TcIdentityNumber ?? "", @"^\d{11}$"))
                    yield return new ValidationResult("T.C. kimlik numarası tam 11 hane olmalıdır.", [nameof(TcIdentityNumber)]);
                if (!BirthDate.HasValue || BirthDate.Value.Date > DateTime.UtcNow.Date.AddYears(-18))
                    yield return new ValidationResult("Doğum tarihi zorunludur ve 18 yaşından büyük olmalısınız.", [nameof(BirthDate)]);
                if (!Regex.IsMatch(Iban ?? "", @"^TR\d{24}$"))
                    yield return new ValidationResult("IBAN TR ile başlayan 26 karakter formatında olmalıdır.", [nameof(Iban)]);
                if (string.IsNullOrWhiteSpace(Address) || Address.Trim().Length < 10)
                    yield return new ValidationResult("İkametgah adresi zorunludur ve en az 10 karakter olmalıdır.", [nameof(Address)]);
                if (string.IsNullOrWhiteSpace(LicenseClass))
                    yield return new ValidationResult("Ehliyet sınıfı zorunludur.", [nameof(LicenseClass)]);
                if (!AcceptedLocationTracking)
                    yield return new ValidationResult("Aktif sefer sırasında konum takibi onayı zorunludur.", [nameof(AcceptedLocationTracking)]);
            }
        }
    }
}
