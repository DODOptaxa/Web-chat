using Microsoft.AspNetCore.SignalR;

namespace SuperDuperDODO_Chat.Hubs
{
    public class LobbyHub : Hub
    {
        private static int _connectedCount = 0;

        public override async Task OnConnectedAsync()
        {
            Interlocked.Increment(ref _connectedCount);
            await Clients.All.SendAsync("UsersOnline", _connectedCount);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Interlocked.Decrement(ref _connectedCount);
            await Clients.All.SendAsync("UsersOnline", _connectedCount);
            await base.OnDisconnectedAsync(exception);
        }
    }
}
