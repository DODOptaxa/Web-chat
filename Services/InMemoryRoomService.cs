using SuperDuperDODO_Chat.Models;
using System.Collections.Concurrent;

namespace SuperDuperDODO_Chat.Services
{
    public class InMemoryRoomService: IRoomService
    {
        private readonly ConcurrentDictionary<string, Room> _rooms = new();

        public InMemoryRoomService()
        {

            CreateRoom("general", "Общий", "💬");
            CreateRoom("random", "Флудилка", "🎲");
            CreateRoom("dev", "Разработка", "⚙️");
        }

        public Room? GetRoom(string roomId) =>
            _rooms.GetValueOrDefault(roomId);

        public Room CreateRoom(string id, string name, string icon = "#")
        {
            var room = new Room { Id = id, Name = name, Icon = icon };
            _rooms[id] = room;
            return room;
        }

        public IEnumerable<Room> GetAllRooms() => _rooms.Values;
    }
}
