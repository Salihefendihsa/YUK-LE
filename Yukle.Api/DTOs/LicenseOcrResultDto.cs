using System;

namespace Yukle.Api.DTOs
{
    public class LicenseOcrResultDto
    {
        public string? FullName { get; set; }
        public string? IdNumber { get; set; }
        public string? LicenseClass { get; set; }
        public DateTime? BirthDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }
}
