using Microsoft.Extensions.Options;
using Resend;
using SuperDuperDODO_Chat.Models;
using System.Net.Http.Headers;

namespace SuperDuperDODO_Chat.Services.Resend
{
    public class ResendEmailService : IEmailService
    {
        private readonly ResendClient _resend;
        private readonly ILogger<ResendEmailService> _logger;
        private readonly string _defaultFrom;

        public ResendEmailService(
        ResendClient resend,
        ILogger<ResendEmailService> logger,
        IOptions<ResendEmailOptions> options)
        {
            _resend = resend;
            _logger = logger;
            _defaultFrom = options.Value.DefaultFrom;
        }

        public async Task<EmailResult> SendCodeAsync(EmailRequest request, CancellationToken ct = default)
        {
            try
            {
                var message = BuildMessage(request);
                var response = await _resend.EmailSendAsync(message, ct);

                if (!response.Success)
                {
                    var errorMessage = response.Exception?.Message ?? "Неизвестная ошибка Resend API";
                    _logger.LogWarning("Failed to send email to {To}. Resend Error: {Error}", request.To, errorMessage);

                    return new EmailResult(false, null, errorMessage);
                }

                var messageId = response.Content.ToString();
                _logger.LogInformation("Email sent to {To}, messageId: {Id}", request.To, messageId);

                return new EmailResult(true, messageId, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception while sending email to {To}", request.To);
                return new EmailResult(false, null, ex.Message);
            }
        }
        private EmailMessage BuildMessage(EmailRequest request) => new()
        {
            From = request.From ?? _defaultFrom,
            To = [request.To],
            Subject = request.Subject,
            HtmlBody = request.HtmlBody,
            ReplyTo = request.ReplyTo is not null ? [request.ReplyTo] : null,
        };
    }
}
