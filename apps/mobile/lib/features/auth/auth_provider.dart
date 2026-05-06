import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/providers.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final bool isCheckingAuth;
  final String? error;
  final String? pendingPhone;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.isCheckingAuth = true,
    this.error,
    this.pendingPhone,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    bool? isCheckingAuth,
    String? error,
    String? pendingPhone,
    bool clearError = false,
    bool clearPhone = false,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      isCheckingAuth: isCheckingAuth ?? this.isCheckingAuth,
      error: clearError ? null : (error ?? this.error),
      pendingPhone: clearPhone ? null : (pendingPhone ?? this.pendingPhone),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Dio _dio;

  AuthNotifier(this._dio) : super(const AuthState()) {
    _checkStoredToken();
  }

  Future<void> _checkStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    state = state.copyWith(
      isAuthenticated: token != null,
      isCheckingAuth: false,
    );
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.post(
        '/auth/driver/login',
        data: {'email': email, 'password': password},
      );

      final data = response.data as Map<String, dynamic>;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', data['accessToken'] as String);
      if (data['refreshToken'] != null) {
        await prefs.setString('refresh_token', data['refreshToken'] as String);
      }

      state = state.copyWith(isLoading: false, isAuthenticated: true);
      return true;
    } on DioException catch (e) {
      final message = _parseError(e);
      state = state.copyWith(isLoading: false, error: message);
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String phone,
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _dio.post(
        '/auth/driver/register',
        data: {
          'fullName': fullName,
          'phone': phone,
          'email': email,
          'password': password,
        },
      );
      state = state.copyWith(isLoading: false, pendingPhone: phone);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
      return false;
    }
  }

  Future<bool> verifyOtp(String phone, String otp) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.post(
        '/auth/driver/verify-otp',
        data: {'phone': phone, 'otp': otp},
      );

      final data = response.data as Map<String, dynamic>;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', data['accessToken'] as String);
      if (data['refreshToken'] != null) {
        await prefs.setString('refresh_token', data['refreshToken'] as String);
      }

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        clearPhone: true,
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    state = const AuthState(isCheckingAuth: false);
  }

  String _parseError(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }
    switch (e.response?.statusCode) {
      case 400:
        return 'Geçersiz bilgiler';
      case 401:
        return 'E-posta veya şifre hatalı';
      case 404:
        return 'Hesap bulunamadı';
      case 500:
        return 'Sunucu hatası, lütfen tekrar deneyin';
      default:
        return 'Bağlantı hatası';
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final api = ref.watch(apiClientProvider);
  return AuthNotifier(api.dio);
});
