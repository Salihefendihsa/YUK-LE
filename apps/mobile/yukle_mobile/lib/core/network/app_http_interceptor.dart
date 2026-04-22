import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Faz 5: YÜK-LE Mobil Temel Interceptor
/// Bütün HTTP isteklerinde token eklemek ve 401 Unauthorized durumunda Refresh Token akışını başlatmak için kullanılır.
class AppHttpInterceptor extends Interceptor {
  final Dio dio;
  final FlutterSecureStorage secureStorage = const FlutterSecureStorage();

  AppHttpInterceptor(this.dio);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Hafızadan yetki tokenını oku
    final accessToken = await secureStorage.read(key: 'access_token');
    
    // Giden isteğe Auth Başlığını tak
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    
    // Correlation ID opsiyonel olarak mobil cihaz tarafından eklenebilir veya backend üretir.
    // options.headers['x-correlation-id'] = DateTime.now().millisecondsSinceEpoch.toString();

    super.onRequest(options, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // 401 Yetkisiz (Token kullanım süresi dolmuş veya geçersiz)
    if (err.response?.statusCode == 401) {
      bool isRefreshed = await _refreshToken();

      if (isRefreshed) {
        // Yeni token ile başarısız isteği tekrar et
        try {
          final newAccessToken = await secureStorage.read(key: 'access_token');
          final opts = err.requestOptions;
          opts.headers['Authorization'] = 'Bearer $newAccessToken';
          
          final clonedRequest = await dio.fetch(opts);
          return handler.resolve(clonedRequest);
        } catch (e) {
          return handler.next(err);
        }
      } else {
        // Refresh işlemi başarısızsa kullanıcıyı login ekranına atmak için error'u pasla
        // Uygulama seviyesinde bloc/provider bu 401 hatasını yakalayıp sayfayı değiştirir.
        return handler.next(err);
      }
    }
    
    super.onError(err, handler);
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await secureStorage.read(key: 'refresh_token');
      if (refreshToken == null) return false;

      // TODO: Gerçek Refresh API uç noktasına istek at. Örnek:
      /*
      final refreshDio = Dio(BaseOptions(baseUrl: dio.options.baseUrl));
      final response = await refreshDio.post('/api/auth/refresh', data: {
        'refreshToken': refreshToken
      });
      
      final newAccess = response.data['token'];
      final newRefresh = response.data['refreshToken'];
      
      await secureStorage.write(key: 'access_token', value: newAccess);
      await secureStorage.write(key: 'refresh_token', value: newRefresh);
      return true;
      */
      
      return false; // Simülasyon şimdilik false dönüyor
    } catch (e) {
      return false;
    }
  }
}
