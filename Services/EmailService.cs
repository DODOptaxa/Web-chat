using SuperDuperDODO_Chat.Models;

namespace SuperDuperDODO_Chat.Services
{
    public interface IEmailService
    {
        Task<EmailResult> SendCodeAsync(EmailRequest request, CancellationToken ct = default);
    }
}
