import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '_http_overrides_stub.dart'
    if (dart.library.io) '_http_overrides_native.dart' as http_setup;

const _baseUrl = 'https://localhost:7140/api';

class ApiClient {
  late final Dio dio;

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    if (kDebugMode) {
      http_setup.setupDebugHttpClient(dio);
    }

    dio.interceptors.add(_JwtInterceptor(dio));
  }
}

class _JwtInterceptor extends Interceptor {
  final Dio _dio;
  bool _isRefreshing = false;

  _JwtInterceptor(this._dio);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final prefs = await SharedPreferences.getInstance();
        final refreshToken = prefs.getString('refresh_token');

        if (refreshToken == null) {
          await _clearTokens(prefs);
          _isRefreshing = false;
          handler.next(err);
          return;
        }

        final response = await _dio.post(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
          options: Options(headers: {}),
        );

        final newAccess = response.data['accessToken'] as String?;
        final newRefresh = response.data['refreshToken'] as String?;

        if (newAccess != null) {
          await prefs.setString('access_token', newAccess);
          if (newRefresh != null) {
            await prefs.setString('refresh_token', newRefresh);
          }

          final retryOpts = err.requestOptions;
          retryOpts.headers['Authorization'] = 'Bearer $newAccess';
          final retryResponse = await _dio.fetch(retryOpts);
          _isRefreshing = false;
          handler.resolve(retryResponse);
          return;
        }
      } catch (_) {
        final prefs = await SharedPreferences.getInstance();
        await _clearTokens(prefs);
      }
      _isRefreshing = false;
    }
    handler.next(err);
  }

  Future<void> _clearTokens(SharedPreferences prefs) async {
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
  }
}
