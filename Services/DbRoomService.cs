using Microsoft.EntityFrameworkCore;
using SuperDuperDODO_Chat.EFcore;
using SuperDuperDODO_Chat.Migrations;
using SuperDuperDODO_Chat.Models;

namespace SuperDuperDODO_Chat.Services
{
    public class DbRoomService: IRoomService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        public DbRoomService(IServiceScopeFactory scopeFactory) {
            _scopeFactory = scopeFactory;
        }

        public Room? GetRoom(string roomId)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();
            return db.Rooms
                .Include(r => r.Messages)
                    .ThenInclude(m => m.Reactions)
                .Include(r => r.Messages)
                    .ThenInclude(m => m.ReplyTo)
                .AsSplitQuery()
                .FirstOrDefault(r => r.Id == roomId);
        }

        public Room CreateRoom(string id, string name, string icon = "#")
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();
            var room = new Room { Id = id, Name = name, Icon = icon };
            db.Rooms.Add(room);
            db.SaveChanges();
            return room;
        }

        public void DeleteRoom(string roomId) {
            if (roomId == "general") return; 
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();
            var room = db.Rooms.FirstOrDefault(r => r.Id == roomId);
            if (room != null) {
                db.Rooms.Remove(room);
                db.SaveChanges();
            }
        }

        public IEnumerable<Room> GetAllRooms()
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();
            if (!db.Rooms.Any())
            {
                var general = new Room { Id = "general", Name = "Общий", Icon = "💬" };
                db.Rooms.Add(general);
                db.SaveChanges();
            }
            return db.Rooms.OrderBy(r => r.CreatedAt).ToList(); 
        }
    }
}
