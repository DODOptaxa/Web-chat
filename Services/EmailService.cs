namespace SuperDuperDODO_Chat.Services
{
    public interface IEmailService
    {
        Task SendVerificationCodeAsync(string toEmail, string code);
    }
}
