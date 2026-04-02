using Yukle.Api.Models;

namespace Yukle.Api.Services
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
