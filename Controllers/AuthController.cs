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
        private readonly IEmailService _emailService;
        private readonly VerificationCodeStore _codeStore;

        public AuthController(TokenService tokenService, ChatDbContext db, IPasswordHasher<User> passwordHasher, IEmailService emailService, VerificationCodeStore codeStore)
        {
            _tokenService = tokenService;
            _db = db;
            _passwordHasher = passwordHasher;
            _emailService = emailService;
            _codeStore = codeStore;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (_db.Users.Any(u => u.UserName == dto.UserName))
                return BadRequest(new { error = "Имя уже занято" });

            if (_db.Users.Any(u => u.Email == dto.Email))
                return BadRequest(new { error = "Email уже используется" });


            var isValid = _codeStore.Verify(dto.Email, dto.Code);

            if (!isValid)
                return BadRequest(new { error = "Неверный или истёкший код" });

            var user = new User { UserName = dto.UserName, Email = dto.Email };
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new { token = _tokenService.GenerateToken(user), user.UserName, message = "Регистрация успешна! Код подтверждения отправлен на почту" });
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

        [HttpPost("send-code")]
        public async Task<IActionResult> SendCode(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email обязателен" });

            var code = _codeStore.GenerateAndStore(email);

            try
            {
                await _emailService.SendCodeAsync(new EmailRequest(
                    To: email,
                    Subject: "Добро пожаловать!",
                    HtmlBody: $"<h1>Спасибо за регистрацию! Ваш код подтверждения: {code}</h1>"));
                return Ok(new { message = "Код отправлен на почту" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Не удалось отправить письмо", error = ex.Message });
            }
        }

        [HttpPost("verify-code")]
        public IActionResult VerifyCode([FromBody] VerifyCodeRequest request)
        {
            var isValid = _codeStore.Verify(request.Email, request.Code);

            if (!isValid)
                return BadRequest(new { error = "Неверный или истёкший код" });

            return Ok(new { message = "Код подтверждён" });
        }
    }

    public record RegisterDto(string UserName, string Email, string Password, string Code);
    public record LoginDto(string Email, string Password);
}
