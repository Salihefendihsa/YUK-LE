class ApiConstants {
  /// Android emulator → host machine localhost
  static const String baseUrl = 'http://10.0.2.2:5151';

  static const String login = '/api/Auth/login';
  static const String verifyOtp = '/api/Auth/verify-otp';
  static const String refreshToken = '/api/Auth/refresh-token';
}
