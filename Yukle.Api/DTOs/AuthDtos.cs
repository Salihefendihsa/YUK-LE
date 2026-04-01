namespace Yukle.Api.DTOs
{
    public class UserRegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer"; // Customer, Driver
        public bool IsCorporate { get; set; }
        public string TaxNumberOrTCKN { get; set; } = string.Empty;
    }

    public class UserLoginDto
    {
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
