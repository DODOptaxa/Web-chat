namespace SuperDuperDODO_Chat.Models
{
    public record EmailRequest(
    string To,
    string Subject,
    string HtmlBody,
    string? From = null,
    string? ReplyTo = null
);

    public record EmailResult(bool Success, string? MessageId, string? Error);
}
