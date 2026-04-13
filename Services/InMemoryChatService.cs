using SuperDuperDODO_Chat.Models;
namespace SuperDuperDODO_Chat.Services
{
    public class InMemoryChatService : IChatService
    {
        private readonly Queue<Message> _messages = new Queue<Message>();
        private const int MaxMessages = 305;
        public Message AddMessage(string userName, string text, string? roomId = null)
        {
            var message = new Message
            {
                UserName = userName,
                Text = text,
            };
            lock (_messages)
            {
                if (_messages.Count >= MaxMessages)
                {
                    _messages.Dequeue();
                }
                _messages.Enqueue(message);
            }
            return message;
        }
        public Message AddMessage(Message message)
        {
            lock (_messages)
            {
                if (_messages.Count >= MaxMessages)
                {
                    _messages.Dequeue();
                }
                _messages.Enqueue(message);
            }
            return message;
        }
        public IReadOnlyList<Message> GetRecentMessages(int count = MaxMessages, string? room = null)
        {
            lock (_messages)
            {
                return _messages.TakeLast(count).ToList();
            }
        }

        public (List<ReactionDto> Reactions, string? RoomId) ToggleReaction(int messageId, string userName, string emoji)
            => ([], null);
    }
}
