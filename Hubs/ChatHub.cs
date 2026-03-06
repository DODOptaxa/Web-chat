using SuperDuperDODO_Chat.Models;
using SuperDuperDODO_Chat.Services;
using Microsoft.AspNetCore.SignalR;

namespace SuperDuperDODO_Chat.Hubs
{
    public class ChatHub: Hub
    {
        private readonly IRoomService _roomService;
        private readonly IChatService _chatService;
        public ChatHub(IChatService chatService, IRoomService roomService) {
            _chatService = chatService;
            _roomService = roomService;
        }

        public async Task SendMessage(string roomId, string userName, string text)
        {
            var msg = new Message
            {
                RoomId = roomId,
                UserName = userName,
                Text = text,
            };
            var message = _chatService.AddMessage(msg);

            await Clients.Others.SendAsync("UserStoppedTyping", userName);
            await Clients.Group(roomId).SendAsync("ReceiveMessage", message.ToDto(), roomId);
        }

        public override async Task OnConnectedAsync()
        {
            var recentMessages = _chatService.GetRecentMessages();
            await Clients.Caller.SendAsync("ChatHistory", recentMessages.Select(m => m.ToDto()));
            await base.OnConnectedAsync();
        }

        public async Task Register(string userName)
        {
            Context.Items["UserName"] = userName;
            await Clients.Others.SendAsync("SystemMessage", $"{userName} вошёл в чат 👋");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userName = Context.Items["UserName"]?.ToString();
            await Clients.Others.SendAsync("SystemMessage", $"{userName} отключился 💫");
            await base.OnDisconnectedAsync(exception);
        }

        public async Task AbortBlyat()
        {
            var userName = Context.Items["UserName"]?.ToString();
            await Clients.Others.SendAsync("SystemMessage", $"{userName} совершил аборт 💥");
            Console.WriteLine(Context.ConnectionId);
            Context.Abort();
        }

        public async Task StartTyping(string userName)
        {
            await Clients.Others.SendAsync("UserTyping", userName);
        }

        public async Task StopTyping(string userName)
        {
            await Clients.Others.SendAsync("UserStoppedTyping", userName);
        }

        public IEnumerable<object> GetRooms() =>
       _roomService.GetAllRooms().Select(r => new {
           r.Id,
           r.Name,
           r.Icon,
           MemberCount = r.Members.Count
       });

        public async Task JoinRoom(string roomId)
        {
            var room = _roomService.GetRoom(roomId);
            if (room == null) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            room.Members.Add(Context.ConnectionId);

            await Clients.Caller.SendAsync("LoadHistory", room.Messages.Select(m => m.ToDto()));
        }

        public async Task LeaveRoom(string roomId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
            var room = _roomService.GetRoom(roomId);
            room?.Members.Remove(Context.ConnectionId);
        }

        public async Task CreateRoom(string name, string icon = "#")
        {
            var roomId = Guid.NewGuid().ToString();
            var room = _roomService.CreateRoom(roomId, name, icon);
            await Clients.All.SendAsync("RoomCreated", new { room.Id, room.Name, room.Icon });
        }
    }
}
