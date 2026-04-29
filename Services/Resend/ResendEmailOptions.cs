namespace SuperDuperDODO_Chat.Services.Resend
{
    public class ResendEmailOptions
    {
        public const string Section = "Resend";
        public string ApiKey { get; set; } = string.Empty;
        public string DefaultFrom { get; set; } = string.Empty;
    }
}
