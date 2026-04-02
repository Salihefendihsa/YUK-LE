using System.Threading.Tasks;
using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Services
{
    public interface IAuthService
    {
        Task<User> RegisterAsync(UserRegisterDto dto);
        Task<string> LoginAsync(UserLoginDto dto);
    }
}
