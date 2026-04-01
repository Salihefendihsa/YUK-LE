namespace Yukle.Api.Models
{
    public enum LoadStatus
    {
        Active,
        Assigned,
        InProgress,
        Completed,
        Canceled
    }

    public enum CargoType
    {
        General,
        Palletized,
        Liquid,
        ColdChain,
        Heavy
    }

    public enum BidStatus
    {
        Pending,
        Accepted,
        Rejected,
        Canceled
    }
}
