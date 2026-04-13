using SuperDuperDODO_Chat.Models;
using SuperDuperDODO_Chat.EFcore;
using Microsoft.EntityFrameworkCore;

namespace SuperDuperDODO_Chat.Services
{
    public class DbChatService : IChatService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public DbChatService(IServiceScopeFactory scopeFactory)
            => _scopeFactory = scopeFactory;

        public Message AddMessage(string userName, string text, string? roomId = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();

            var message = new Message { RoomId = roomId, UserName = userName, Text = text };
            db.Messages.Add(message);
            db.SaveChanges();

            return message;
        }

        public Message AddMessage(Message message)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();
            db.Messages.Add(message);
            db.SaveChanges();

            // Eagerly load ReplyTo so ToDto() can populate reply fields
            if (message.ReplyToId.HasValue)
                db.Entry(message).Reference(m => m.ReplyTo).Load();

            return message;
        }

        public IReadOnlyList<Message> GetRecentMessages(int count = 305, string? roomId = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();

            return db.Messages
                .Where(m => m.RoomId == roomId)
                .Include(m => m.ReplyTo)
                .Include(m => m.Reactions)
                .AsSplitQuery()
                .OrderByDescending(m => m.SentAt)
                .Take(count)
                .OrderBy(m => m.SentAt)
                .ToList();
        }

        public (List<ReactionDto> Reactions, string? RoomId) ToggleReaction(int messageId, string userName, string emoji)
        {
            Console.WriteLine($"Toggling reaction: MessageId={messageId}, UserName={userName}, Emoji={emoji}");
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();

            var existing = db.MessageReactions
                .FirstOrDefault(r => r.MessageId == messageId && r.UserName == userName && r.Emoji == emoji);

            if (existing != null)
                db.MessageReactions.Remove(existing);
            else
                db.MessageReactions.Add(new MessageReaction { MessageId = messageId, UserName = userName, Emoji = emoji });

            db.SaveChanges();

            var reactions = db.MessageReactions
                .Where(r => r.MessageId == messageId)
                .GroupBy(r => r.Emoji)
                .Select(g => new ReactionDto
                {
                    Emoji = g.Key,
                    Count = g.Count(),
                    Users = g.Select(r => r.UserName).ToList()
                })
                .ToList();

            var roomId = db.Messages
                .Where(m => m.Id == messageId)
                .Select(m => m.RoomId)
                .FirstOrDefault();

            return (reactions, roomId);
        }
    }
}
