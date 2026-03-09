using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SuperDuperDODO_Chat.EFcore;
using SuperDuperDODO_Chat.Models;
using SuperDuperDODO_Chat.Services;

namespace SuperDuperDODO_Chat.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly TokenService _tokenService;
        private readonly ChatDbContext _db;
        private readonly IPasswordHasher<User> _passwordHasher;

        public AuthController(TokenService tokenService, ChatDbContext db, IPasswordHasher<User> passwordHasher)
        {
            _tokenService = tokenService;
            _db = db;
            _passwordHasher = passwordHasher;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (_db.Users.Any(u => u.UserName == dto.UserName))
                return BadRequest(new { error = "Имя уже занято" });

            if (_db.Users.Any(u => u.Email == dto.Email))
                return BadRequest(new { error = "Email уже используется" });

            var user = new User { UserName = dto.UserName, Email = dto.Email };
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new { token = _tokenService.GenerateToken(user), user.UserName });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            var user = _db.Users.FirstOrDefault(u => u.Email == dto.Email);
            if (user == null) return Unauthorized(new { error = "Неверный email или пароль" });

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
                return Unauthorized(new { error = "Неверный email или пароль" });

            return Ok(new { token = _tokenService.GenerateToken(user), user.UserName });
        }
    }

    public record RegisterDto(string UserName, string Email, string Password);
    public record LoginDto(string Email, string Password);
}
