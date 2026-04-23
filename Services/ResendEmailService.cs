using System.Net.Http.Headers;

namespace SuperDuperDODO_Chat.Services
{
    public class ResendEmailService : IEmailService
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;

        public ResendEmailService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _apiKey = config["Resend:ApiKey"]!;
        }

        public async Task SendVerificationCodeAsync(string toEmail, string code)
        {
            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);

            var payload = new
            {
                from = "onboarding@resend.dev",  
                to = new[] { toEmail },
                subject = "Код подтверждения",
                html = $"""
                <div style="font-family:sans-serif; max-width:400px; margin:auto;">
                    <h2>Код подтверждения</h2>
                    <p>Используй этот код для входа. Он действителен <strong>10 минут</strong>.</p>
                    <div style="font-size:36px; font-weight:bold; letter-spacing:10px;
                                color:#2563eb; padding:20px; background:#f1f5f9;
                                text-align:center; border-radius:8px;">
                        {code}
                    </div>
                    <p style="color:#94a3b8; font-size:12px;">
                        Если вы не запрашивали код — проигнорируйте письмо.
                    </p>
                </div>
            """
            };

            var response = await _http.PostAsJsonAsync("https://api.resend.com/emails", payload);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Ошибка отправки email: {error}");
            }

        }
    }
}
