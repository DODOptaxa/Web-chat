using SuperDuperDODO_Chat.Models;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace SuperDuperDODO_Chat.EFcore
{
    public class ChatDbContext : DbContext
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options) { }

        public DbSet<Message> Messages { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<MessageReaction> MessageReactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Room)
                .WithMany(r => r.Messages)
                .HasForeignKey(m => m.RoomId)
                .OnDelete(DeleteBehavior.Cascade);

            // Self-referential reply — NoAction to avoid SQL Server cascade cycles
            modelBuilder.Entity<Message>()
                .HasOne(m => m.ReplyTo)
                .WithMany()
                .HasForeignKey(m => m.ReplyToId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<MessageReaction>()
                .HasOne(r => r.Message)
                .WithMany(m => m.Reactions)
                .HasForeignKey(r => r.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            // One reaction per user per emoji per message
            modelBuilder.Entity<MessageReaction>()
                .HasIndex(r => new { r.MessageId, r.UserName, r.Emoji })
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.UserName).IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email).IsUnique();
        }
    }
}
