using System.ComponentModel.DataAnnotations;

namespace Yukle.Api.DTOs;

public class AdminReviewDecisionDto
{
    /// <summary>
    /// Admin kararı: Onaylıyoruz (true) mu yoksa reddediyoruz (false) mu?
    /// </summary>
    [Required]
    public bool IsApproved { get; set; }

    /// <summary>
    /// Eğer reddediliyorsa, kullanıcıya gönderilecek neden mesajı. 
    /// Onaylıyorsa adminin düştüğü opsiyonel not.
    /// </summary>
    [Required(AllowEmptyStrings = false, ErrorMessage = "Aksiyon için mantıklı bir açıklama (neden) girmelisiniz.")]
    public string Reason { get; set; } = string.Empty;
}
