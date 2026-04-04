using System.Threading.Channels;
using Yukle.Api.DTOs;

namespace Yukle.Api.BackgroundServices;

// ── İş Kalemi Tipleri ────────────────────────────────────────────────────────

public enum GeminiWorkItemType { Price, Ocr }

/// <summary>
/// Kuyruğa atılabilen tüm Gemini görevlerinin ortak tabanı.
/// UserId: sonuç SignalR ile kime fırlatılacak.
/// </summary>
public abstract class GeminiWorkItem
{
    public abstract GeminiWorkItemType Type { get; }
    public string UserId { get; init; } = string.Empty;
}

/// <summary>
/// Navlun fiyat analizi görevi.
/// Hafif işlem — yüksek öncelikli kanalda işlenir.
/// </summary>
public sealed class PriceAnalysisWorkItem : GeminiWorkItem
{
    public override GeminiWorkItemType Type => GeminiWorkItemType.Price;

    public required double  Distance    { get; init; }
    public required string  VehicleType { get; init; }
    public required decimal FuelPrice   { get; init; }
    public required double  Weight      { get; init; }

    /// <summary>
    /// İsteğe bağlı güzergah bağlamı — Gemini'ye bölgesel faktörleri bildirir.
    /// Ör: "İstanbul → Erzurum", "Doğu Anadolu dağlık arazi", "İstanbul trafiği".
    /// </summary>
    public string? Route { get; init; }
}

/// <summary>
/// Ehliyet / SRC / ruhsat OCR görevi.
/// Ağır işlem — düşük öncelikli kanalda, kontrollü hızda işlenir.
/// </summary>
public sealed class OcrWorkItem : GeminiWorkItem
{
    public override GeminiWorkItemType Type => GeminiWorkItemType.Ocr;

    public required byte[] ImageBytes    { get; init; }
    public string          MimeType      { get; init; } = "image/jpeg";
    public DocumentType    DocumentType  { get; init; } = DocumentType.DriverLicense;
}

// ── Kuyruk ───────────────────────────────────────────────────────────────────

/// <summary>
/// İki ayrı <see cref="Channel{T}"/> üzerinden çalışan Gemini görev kuyruğu.
/// <list type="bullet">
///   <item>Fiyat kanalı (kapasite 500): hafif, yüksek öncelikli.</item>
///   <item>OCR kanalı (kapasite 50): ağır, düşük öncelikli.</item>
/// </list>
/// Singleton olarak register edilir; thread-safe.
/// </summary>
public sealed class GeminiTaskQueue
{
    private readonly Channel<GeminiWorkItem> _priceChannel;
    private readonly Channel<GeminiWorkItem> _ocrChannel;

    public GeminiTaskQueue()
    {
        _priceChannel = Channel.CreateBounded<GeminiWorkItem>(
            new BoundedChannelOptions(500)
            {
                FullMode     = BoundedChannelFullMode.Wait,
                SingleReader = true,
                SingleWriter = false
            });

        _ocrChannel = Channel.CreateBounded<GeminiWorkItem>(
            new BoundedChannelOptions(50)
            {
                FullMode     = BoundedChannelFullMode.Wait,
                SingleReader = true,
                SingleWriter = false
            });
    }

    // ── Yazma ────────────────────────────────────────────────────────────────

    public ValueTask EnqueuePriceAsync(PriceAnalysisWorkItem item, CancellationToken ct = default)
        => _priceChannel.Writer.WriteAsync(item, ct);

    public ValueTask EnqueueOcrAsync(OcrWorkItem item, CancellationToken ct = default)
        => _ocrChannel.Writer.WriteAsync(item, ct);

    // ── Okuma (non-blocking) ─────────────────────────────────────────────────

    public bool TryReadPrice(out GeminiWorkItem? item)
        => _priceChannel.Reader.TryRead(out item);

    public bool TryReadOcr(out GeminiWorkItem? item)
        => _ocrChannel.Reader.TryRead(out item);

    // ── Bekleme (blocking) ───────────────────────────────────────────────────

    public ValueTask<bool> WaitForPriceAsync(CancellationToken ct)
        => _priceChannel.Reader.WaitToReadAsync(ct);

    public ValueTask<bool> WaitForOcrAsync(CancellationToken ct)
        => _ocrChannel.Reader.WaitToReadAsync(ct);

    // ── Metrikler ────────────────────────────────────────────────────────────

    public int PriceQueueCount => _priceChannel.Reader.Count;
    public int OcrQueueCount   => _ocrChannel.Reader.Count;
}
