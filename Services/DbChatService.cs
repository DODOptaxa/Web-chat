using SuperDuperDODO_Chat.Models;
using System;
using SuperDuperDODO_Chat.EFcore;

namespace SuperDuperDODO_Chat.Services
{
    public class DbChatService: IChatService
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
            return message;
        }

        public IReadOnlyList<Message> GetRecentMessages(int count = 305, string? roomId = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();

            return db.Messages
                .Where(m => m.RoomId == roomId)
                .OrderByDescending(m => m.SentAt)
                .Take(count)
                .OrderBy(m => m.SentAt)  
                .ToList();
        }
    }
}
