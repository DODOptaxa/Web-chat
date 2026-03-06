using SuperDuperDODO_Chat.Hubs;
using SuperDuperDODO_Chat.Services;
using SuperDuperDODO_Chat.Models;
using SuperDuperDODO_Chat.EFcore;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
//builder.Services.AddSingleton<IChatService, InMemoryChatService>();
builder.Services.AddDbContext<ChatDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("Chat")));
builder.Services.AddScoped<IChatService, DbChatService>();
builder.Services.AddSingleton<IRoomService, DbRoomService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHub<ChatHub>("/hub/chat");
app.MapHub<LobbyHub>("/hub/lobby");

app.Run();
