using Yukle.Api.DTOs;

namespace Yukle.Api.Services;

/// <summary>Admin inceleme kuyrugu icin yuklenen belge onizlemelerini diske yazar (KVKK: yalnizca inceleme suresi).</summary>
public interface IDriverReviewDocumentStore
{
    Task<string?> SaveAsync(int userId, DocumentType documentType, byte[] imageBytes, string mimeType);
    Task<(byte[] Data, string ContentType)?> TryGetAsync(int userId, DocumentType documentType);
}
