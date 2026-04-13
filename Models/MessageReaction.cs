using System.Text.Json.Serialization;

namespace SuperDuperDODO_Chat.Models
{
    public class MessageReaction
    {
        public int Id { get; set; }
        public int MessageId { get; set; }

        [JsonIgnore]
        public Message Message { get; set; } = null!;

        public string UserName { get; set; } = "";
        public string Emoji { get; set; } = "";
    }
}
