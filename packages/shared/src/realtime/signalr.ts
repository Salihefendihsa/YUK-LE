/**
 * SignalR erişim-token sözleşmesi (web ↔ mobil ortak, TYPE düzeyi).
 *
 * @microsoft/signalr `withUrl(..., { accessTokenFactory })` her (yeniden) bağlanışta
 * factory'yi çağırır. KANONİK desen (web lib/chatHub.ts): factory token'ı her çağrıda
 * depodan TAZE okur — REST 401'de token yenilenince hub bayat token'la kalmaz.
 *
 * NOT (saf refactor sınırı): token AKTARIM MEKANİZMASI ve base-URL çözümü platforma
 * özgüdür (web: apiClient.baseURL + WebSockets; mobil: API_BASE_URL + query-string).
 * Bunları birleştirmek çalışma-zamanı davranışını değiştirir → burada SADECE tip
 * sözleşmesi paylaşılır; implementasyon her app'te kalır.
 */
export type AccessTokenFactory = () => string | Promise<string>;
