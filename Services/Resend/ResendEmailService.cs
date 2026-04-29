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

                _logger.LogInformation("Email sent to {To}, messageId: {Id}", request.To, response.Content);
                return new EmailResult(true, response.Content.ToString(), null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}", request.To);
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
