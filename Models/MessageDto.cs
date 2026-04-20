namespace SuperDuperDODO_Chat.Models
{
    public class MessageDto
    {
        public int Id { get; set; }
        public string? RoomId { get; set; }
        public string UserName { get; set; } = "";
        public string Text { get; set; } = "";
        public DateTime SentAt { get; set; }
        public int? ReplyToId { get; set; }
        public string? ReplyToUserName { get; set; }
        public string? ReplyToText { get; set; }
        public List<ReactionDto> Reactions { get; set; } = [];

    }

    public class ReactionDto
    {
        public string Emoji { get; set; } = "";
        public int Count { get; set; }
        public List<string> Users { get; set; } = [];
    }
}
