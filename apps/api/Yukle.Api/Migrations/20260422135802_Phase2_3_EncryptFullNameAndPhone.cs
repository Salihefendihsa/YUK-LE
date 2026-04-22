using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class Phase2_3_EncryptFullNameAndPhone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Phase 2.3: FullName + Phone AES-256 Şifreleme Genişletmesi ─────
            //
            // Bu migration KASITLI OLARAK boştur.
            //
            // Neden boş?
            //   EF Core ValueConverter yalnızca C# uygulama katmanında devreye girer;
            //   DB şemasında herhangi bir sütun tipi değişikliği yapmaz.
            //   FullName ve Phone sütunları halihazırda TEXT/VARCHAR tipindedir ve
            //   AES-256-CBC Base64 ciphertext'leri bu tiplerde sorunsuz saklanır.
            //   Bu nedenle şema migrasyonu gerekmez.
            //
            // Peki mevcut plaintext veriler ne olacak?
            //   Uygulama başladıktan sonra:
            //   - YENİ kayıtlar: Uygulama katmanı otomatik olarak şifreler (ValueConverter).
            //   - ESKİ kayıtlar: EncryptionService.Decrypt() fallback mekanizması sayesinde
            //     base64 olmayan plaintext değerleri aynen döndürür; sistem çökmez.
            //
            // Mevcut verileri şifrelemek için (opsiyonel, production öncesi):
            //   1) Veriyi dışa aktar (pg_dump veya EF DbContext.Users.AsNoTracking())
            //   2) Her satır için Encrypt() çağır
            //   3) UPDATE users SET fullname=<ciphertext>, phone=<ciphertext> WHERE id=<id>
            //   Bu işlem için ayrı bir migration script'i veya one-time tool oluşturulabilir.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Şema değişikliği olmadığından rollback da gerekmiyor.
        }
    }
}
