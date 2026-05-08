namespace Yukle.Api.Models;

public enum RaterRole
{
    Customer = 0,
    Driver = 1
}

public class Rating
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LoadId { get; set; }
    public Load Load { get; set; } = null!;
    public int GivenByUserId { get; set; }
    public User GivenByUser { get; set; } = null!;
    public int GivenToUserId { get; set; }
    public User GivenToUser { get; set; } = null!;
    public int Score { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public RaterRole RaterRole { get; set; }
}
