using SuperDuperDODO_Chat.Models;

namespace SuperDuperDODO_Chat.Services
{
    public interface IChatService
    {
        Message AddMessage(string userName, string text, string? roomId = null);
        Message AddMessage(Message message);

        IReadOnlyList<Message> GetRecentMessages(int count = 305, string? room = null);
    }
}
