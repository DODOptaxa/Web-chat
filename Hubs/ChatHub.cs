using SuperDuperDODO_Chat.Models;
using SuperDuperDODO_Chat.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace SuperDuperDODO_Chat.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IRoomService _roomService;
        private readonly IChatService _chatService;

        private string userName => Context.User?.Identity?.Name ?? "Аноним";

        public ChatHub(IChatService chatService, IRoomService roomService)
        {
            _chatService = chatService;
            _roomService = roomService;
        }

        public async Task SendMessage(string roomId, string text, int? replyToId = null)
        {
            var msg = new Message
            {
                RoomId = roomId,
                UserName = userName,
                Text = text,
                ReplyToId = replyToId,
            };
            var message = _chatService.AddMessage(msg);

            await Clients.Others.SendAsync("UserStoppedTyping", userName);
            await Clients.Group(roomId).SendAsync("ReceiveMessage", message.ToDto(), roomId);
        }

        public async Task ToggleReaction(int messageId, string emoji)
        {
            Console.WriteLine($"ToggleReaction: {messageId}, {emoji} by {userName}");
            var (reactions, roomId) = _chatService.ToggleReaction(messageId, userName, emoji);
            if (roomId != null)
                await Clients.Group(roomId).SendAsync("ReactionUpdated", messageId, reactions);
        }

        public override async Task OnConnectedAsync()
        {
            var recentMessages = _chatService.GetRecentMessages();
            await Clients.Caller.SendAsync("ChatHistory", recentMessages.Select(m => m.ToDto()));
            await base.OnConnectedAsync();
        }

        public async Task Register()
        {
            await Clients.Others.SendAsync("SystemMessage", $"{userName} вошёл в чат 👋");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Clients.Others.SendAsync("SystemMessage", $"{userName} отключился 💫");
            await base.OnDisconnectedAsync(exception);
        }

        public async Task AbortBlyat()
        {
            await Clients.Others.SendAsync("SystemMessage", $"{userName} совершил аборт 💥");
            Console.WriteLine(Context.ConnectionId);
            Context.Abort();
        }

        public async Task StartTyping(string roomId)
        {
            await Clients.GroupExcept(roomId, Context.ConnectionId).SendAsync("UserTyping", userName);
        }

        public async Task StopTyping(string roomId)
        {
            await Clients.GroupExcept(roomId, Context.ConnectionId).SendAsync("UserStoppedTyping", userName);
        }

        public IEnumerable<object> GetRooms() =>
            _roomService.GetAllRooms().Select(r => new {
                r.Id,
                r.Name,
                r.Icon,
            });

        public async Task JoinRoom(string roomId)
        {
            var room = _roomService.GetRoom(roomId);
            if (room == null) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            await Clients.Caller.SendAsync("LoadHistory", room.Messages.Select(m => m.ToDto()));
        }

        public async Task LeaveRoom(string roomId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        }

        public async Task CreateRoom(string name, string icon = "#")
        {
            var roomId = Guid.NewGuid().ToString();
            var room = _roomService.CreateRoom(roomId, name, icon);
            await Clients.All.SendAsync("RoomCreated", new { room.Id, room.Name, room.Icon });
        }
    }
}
