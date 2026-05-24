using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

public sealed class DriverReviewDocumentStore(IWebHostEnvironment env) : IDriverReviewDocumentStore
{
    private string RootDir =>
        Path.Combine(env.ContentRootPath, "App_Data", "driver-review-documents");

    private static string ExtensionFor(string mimeType) =>
        mimeType switch
        {
            "image/png"  => ".png",
            "image/webp" => ".webp",
            "image/gif"  => ".gif",
            _            => ".jpg"
        };

    private static string FilePath(string root, int userId, DocumentType documentType, string ext) =>
        Path.Combine(root, userId.ToString(), $"{documentType}{ext}");

    public async Task<string?> SaveAsync(int userId, DocumentType documentType, byte[] imageBytes, string mimeType)
    {
        if (imageBytes is not { Length: > 0 }) return null;

        var userDir = Path.Combine(RootDir, userId.ToString());
        Directory.CreateDirectory(userDir);

        var ext = ExtensionFor(mimeType);
        foreach (var existing in Directory.GetFiles(userDir, $"{documentType}.*"))
            File.Delete(existing);

        var path = FilePath(RootDir, userId, documentType, ext);
        await File.WriteAllBytesAsync(path, imageBytes);

        return $"/api/admin/review-documents/{userId}?docType={documentType}";
    }

    public Task<(byte[] Data, string ContentType)?> TryGetAsync(int userId, DocumentType documentType)
    {
        var userDir = Path.Combine(RootDir, userId.ToString());
        if (!Directory.Exists(userDir))
            return Task.FromResult<(byte[], string)?>(null);

        var match = Directory.GetFiles(userDir, $"{documentType}.*").FirstOrDefault();
        if (match is null)
            return Task.FromResult<(byte[], string)?>(null);

        var ext = Path.GetExtension(match).ToLowerInvariant();
        var contentType = ext switch
        {
            ".png"  => "image/png",
            ".webp" => "image/webp",
            ".gif"  => "image/gif",
            _       => "image/jpeg"
        };

        var data = File.ReadAllBytes(match);
        return Task.FromResult<(byte[], string)?>((data, contentType));
    }
}
