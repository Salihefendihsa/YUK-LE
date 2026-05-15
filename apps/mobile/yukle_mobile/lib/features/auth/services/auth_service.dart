import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../models/auth_response.dart';
import '../models/login_request.dart';

class AuthService {
  late final Dio _dio;

  AuthService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Content-Type': 'application/json'},
      ),
    );
  }

  Future<AuthResponse> login(LoginRequest request) async {
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: request.toJson(),
      );

      if (response.statusCode == 200) {
        return AuthResponse.fromJson(
          Map<String, dynamic>.from(response.data as Map),
        );
      }

      throw Exception('Giriş başarısız');
    } on DioException catch (e) {
      if (e.response?.statusCode == 400 || e.response?.statusCode == 401) {
        final data = e.response?.data;
        String message = 'Telefon numarası veya şifre hatalı';
        if (data is Map) {
          message = data['message'] as String? ??
              data['detail'] as String? ??
              data['title'] as String? ??
              message;
        }
        throw Exception(message);
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw Exception('Sunucuya bağlanılamıyor. Backend çalışıyor mu?');
      }
      throw Exception('Bir hata oluştu: ${e.message}');
    }
  }
}
