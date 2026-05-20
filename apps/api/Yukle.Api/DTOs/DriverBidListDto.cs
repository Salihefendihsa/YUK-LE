namespace Yukle.Api.DTOs;

/// <summary>Soforun verdigi teklifler listesi.</summary>
public sealed class DriverBidListDto
{
    public int      Id        { get; set; }
    public Guid     LoadId    { get; set; }
    public string   FromCity  { get; set; } = string.Empty;
    public string   ToCity    { get; set; } = string.Empty;
    public decimal  Amount    { get; set; }
    public string?  Note      { get; set; }
    public DateTime OfferDate { get; set; }
    public string   Status    { get; set; } = string.Empty;
}
