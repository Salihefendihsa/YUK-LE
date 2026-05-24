using Yukle.Api.Infrastructure;

namespace Yukle.Tests.Pricing;

public sealed class FuelPriceSanityTests
{
  [Fact]
  public void IsPriceValid_FirstRecord_AcceptsInBand()
  {
    var ok = FuelPriceSanity.IsPriceValid(69m, null, 20m, 250m, 25m);
    Assert.True(ok);
  }

  [Fact]
  public void IsPriceValid_StaleCollectApi_RejectedByAbsMin()
  {
    var ok = FuelPriceSanity.IsPriceValid(6.45m, 68m, 20m, 250m, 25m);
    Assert.False(ok);
  }

  [Fact]
  public void IsPriceValid_LargeJump_Rejected()
  {
    var ok = FuelPriceSanity.IsPriceValid(100m, 68m, 20m, 250m, 25m);
    Assert.False(ok);
  }

  [Fact]
  public void IsPriceValid_SmallJump_Accepted()
  {
    var ok = FuelPriceSanity.IsPriceValid(72m, 68m, 20m, 250m, 25m);
    Assert.True(ok);
  }
}
