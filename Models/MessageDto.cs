namespace SuperDuperDODO_Chat.Models
{
    public class MessageDto
    {
        public int Id { get; set; }
        public string? RoomId { get; set; }
        public string UserName { get; set; } = "";
        public string Text { get; set; } = "";
        public DateTime SentAt { get; set; }
    }
}
