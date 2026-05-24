using Yukle.Api.Infrastructure;
using Yukle.Api.Models;

namespace Yukle.Api.Services;

public static class LoadCancellationRules
{
    public const string LoadCancelledCloseReason = "ilan iptal edildi";

    public static bool HasAcceptedBid(Load load, bool hasAcceptedBidRow = false)
        => load.DriverId is not null
           || load.Status is LoadStatus.Assigned or LoadStatus.OnWay or LoadStatus.Arrived
           || hasAcceptedBidRow;

    public static bool CanCustomerCancel(Load load, CancellationOptions opts, bool hasAcceptedBidRow = false)
    {
        if (load.Status == LoadStatus.Cancelled)
            return true;

        if (opts.AllowCustomerCancelAfterAccept)
            return load.Status is LoadStatus.Active or LoadStatus.Assigned;

        return load.Status == LoadStatus.Active && !HasAcceptedBid(load, hasAcceptedBidRow);
    }

    public static bool CanAdminCancel(Load load, CancellationOptions opts)
    {
        if (load.Status == LoadStatus.Cancelled)
            return true;

        if (load.Status is LoadStatus.OnWay or LoadStatus.Arrived or LoadStatus.Delivered)
            return opts.AllowCancelAfterTripStart;

        return load.Status is LoadStatus.Active or LoadStatus.Assigned;
    }

    public static bool CanEdit(Load load, bool hasAcceptedBidRow = false)
        => load.Status == LoadStatus.Active && !HasAcceptedBid(load, hasAcceptedBidRow);

    public static string BlockMessageForStatus(LoadStatus status) => status switch
    {
        LoadStatus.OnWay or LoadStatus.Arrived =>
            "Sefer basladigi icin iptal edilemez; destek ile iletisime gecin.",
        LoadStatus.Delivered =>
            "Teslim edilmis ilan iptal edilemez; destek ile iletisime gecin.",
        LoadStatus.Cancelled =>
            "Ilan zaten iptal edilmis.",
        LoadStatus.Assigned =>
            "Kabul edilmis ilan musteri tarafindan iptal edilemez.",
        _ => "Bu ilan su an iptal edilemez."
    };
}
