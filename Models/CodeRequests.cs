namespace SuperDuperDODO_Chat.Models
{
    public record SendCodeRequest(string Email);

    public record VerifyCodeRequest(string Email, string Code);
}
