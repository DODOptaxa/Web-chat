using SuperDuperDODO_Chat.Models;

namespace SuperDuperDODO_Chat.Services
{
    public interface IRoomService
    {
        public Room? GetRoom(string roomId);

        public Room CreateRoom(string id, string name,string icon = "#");

        public IEnumerable<Room> GetAllRooms();

        public void DeleteRoom(string roomId);
    }
}
