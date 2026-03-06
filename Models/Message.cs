using System.Text.Json.Serialization;

namespace SuperDuperDODO_Chat.Models
{
    public class Message
    {
        public int Id { get; set; }

        public string? RoomId { get; set; }

        [JsonIgnore]
        public Room Room { get; set; } = null!;
        public string UserName { get; set; } = "";
        public string Text { get; set; } = "";
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

    }

    public static class MessageExtensions
    {
        public static MessageDto ToDto(this Message message)
        {
            return new MessageDto
            {
                Id = message.Id,
                RoomId = message.RoomId,
                UserName = message.UserName,
                Text = message.Text,
                SentAt = message.SentAt
            };
        }
    }
}
