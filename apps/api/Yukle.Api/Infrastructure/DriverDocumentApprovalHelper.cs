using Yukle.Api.DTOs;
using Yukle.Api.Models;

namespace Yukle.Api.Infrastructure;

/// <summary>Belge onay bayraklari — AuthService ile ayni kurallar.</summary>
public static class DriverDocumentApprovalHelper
{
    public static void ApplyApproval(User user, DocumentType documentType, DateTime? expiry, string[]? documentClasses)
    {
        switch (documentType)
        {
            case DocumentType.DriverLicense:
                user.IsDriverLicenseApproved = true;
                user.DriverLicenseExpiry = expiry;
                if (documentClasses is { Length: > 0 })
                    user.LicenseClasses = string.Join(",", documentClasses);
                break;
            case DocumentType.SrcCertificate:
                user.IsSrcApproved = true;
                user.SrcExpiry = expiry;
                break;
            case DocumentType.Psychotechnical:
                user.IsPsychotechnicalApproved = true;
                user.PsychotechnicalExpiry = expiry;
                break;
        }
    }

    public static void ApplyRejection(User user, DocumentType documentType)
    {
        switch (documentType)
        {
            case DocumentType.DriverLicense:
                user.IsDriverLicenseApproved = false;
                user.DriverLicenseExpiry = null;
                break;
            case DocumentType.SrcCertificate:
                user.IsSrcApproved = false;
                user.SrcExpiry = null;
                break;
            case DocumentType.Psychotechnical:
                user.IsPsychotechnicalApproved = false;
                user.PsychotechnicalExpiry = null;
                break;
        }
    }

    public static bool AreAllMandatoryDocumentsApproved(User user) =>
        user.IsDriverLicenseApproved
        && user.IsSrcApproved
        && user.IsPsychotechnicalApproved;

    public static bool TryParseDocumentType(string? raw, out DocumentType documentType)
    {
        documentType = DocumentType.DriverLicense;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        return Enum.TryParse<DocumentType>(raw.Trim(), true, out documentType);
    }
}
