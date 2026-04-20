namespace SuperDuperDODO_Chat.Models
{
    public class Room
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
        public string Name { get; set; } = "";
        public string Icon { get; set; } = "#";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<Message> Messages { get; } = [];
    }
}
