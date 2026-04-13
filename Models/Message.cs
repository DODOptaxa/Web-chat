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

        public int? ReplyToId { get; set; }

        [JsonIgnore]
        public Message? ReplyTo { get; set; }

        public List<MessageReaction> Reactions { get; } = [];
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
                SentAt = message.SentAt,
                ReplyToId = message.ReplyToId,
                ReplyToUserName = message.ReplyTo?.UserName,
                ReplyToText = message.ReplyTo?.Text,
                Reactions = message.Reactions
                    .GroupBy(r => r.Emoji)
                    .Select(g => new ReactionDto
                    {
                        Emoji = g.Key,
                        Count = g.Count(),
                        Users = g.Select(r => r.UserName).ToList()
                    })
                    .ToList()
            };
        }
    }
}
