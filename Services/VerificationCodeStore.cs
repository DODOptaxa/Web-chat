using System.Collections.Concurrent;
namespace SuperDuperDODO_Chat.Services
{

    public class VerificationCodeStore
    {
        private readonly ConcurrentDictionary<string, (string Code, DateTime ExpiresAt, bool IsUsed)> _codes = new();

        public string GenerateAndStore(string email)
        {
            var code = new Random().Next(100000, 999999).ToString();
            _codes[email] = (code, DateTime.UtcNow.AddMinutes(10), false);
            return code;
        }

        public bool Verify(string email, string inputCode)
        {
            if (!_codes.TryGetValue(email, out var entry))
                return false;

            if (entry.IsUsed || DateTime.UtcNow > entry.ExpiresAt || entry.Code != inputCode)
                return false;

            _codes[email] = entry with { IsUsed = true };
            return true;
        }
    }
}
