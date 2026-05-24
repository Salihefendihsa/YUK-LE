using Yukle.Api.Infrastructure;
using Yukle.Api.Models;
using Yukle.Api.Services;

namespace Yukle.Tests.Cancellation;

public class LoadCancellationRulesTests
{
    private static readonly CancellationOptions DefaultOpts = CancellationOptions.Defaults();

    [Fact]
    public void CanCustomerCancel_ActiveWithoutDriver_True()
    {
        var load = new Load { Status = LoadStatus.Active, DriverId = null };
        Assert.True(LoadCancellationRules.CanCustomerCancel(load, DefaultOpts));
    }

    [Fact]
    public void CanCustomerCancel_Assigned_False()
    {
        var load = new Load { Status = LoadStatus.Assigned, DriverId = 5 };
        Assert.False(LoadCancellationRules.CanCustomerCancel(load, DefaultOpts));
    }

    [Fact]
    public void CanAdminCancel_OnWay_FalseByDefault()
    {
        var load = new Load { Status = LoadStatus.OnWay };
        Assert.False(LoadCancellationRules.CanAdminCancel(load, DefaultOpts));
    }

    [Fact]
    public void CanAdminCancel_Assigned_True()
    {
        var load = new Load { Status = LoadStatus.Assigned };
        Assert.True(LoadCancellationRules.CanAdminCancel(load, DefaultOpts));
    }

    [Fact]
    public void CanEdit_Active_True()
    {
        var load = new Load { Status = LoadStatus.Active, DriverId = null };
        Assert.True(LoadCancellationRules.CanEdit(load));
    }

    [Fact]
    public void CanEdit_WithAcceptedBid_False()
    {
        var load = new Load { Status = LoadStatus.Active, DriverId = 3 };
        Assert.False(LoadCancellationRules.CanEdit(load));
    }

    [Fact]
    public void BlockMessage_OnWay_TurkishSupportHint()
    {
        var msg = LoadCancellationRules.BlockMessageForStatus(LoadStatus.OnWay);
        Assert.Contains("destek", msg, StringComparison.OrdinalIgnoreCase);
    }
}
