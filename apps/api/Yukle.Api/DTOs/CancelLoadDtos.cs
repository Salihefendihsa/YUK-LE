namespace Yukle.Api.DTOs;

public sealed class CancelLoadRequestDto
{
    public string? Reason { get; set; }
}

public sealed class CancelLoadResultDto
{
    public Guid   LoadId            { get; set; }
    public string Status            { get; set; } = string.Empty;
    public string Message           { get; set; } = string.Empty;
    public bool   AlreadyCancelled  { get; set; }
    public decimal? RefundAmount    { get; set; }
    public int    ClosedBids        { get; set; }
}

public sealed class UpdateLoadResultDto
{
    public LoadListDto Load { get; set; } = null!;
    public bool        MaterialChanged { get; set; }
    public bool        NotifiedDrivers { get; set; }
    public string      Message         { get; set; } = string.Empty;
}
