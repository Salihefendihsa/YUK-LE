class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final String role;
  final String userId;
  final String fullName;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.role,
    required this.userId,
    required this.fullName,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        accessToken: json['token'] as String? ?? json['accessToken'] as String? ?? '',
        refreshToken: json['refreshToken'] as String? ?? '',
        role: json['role'] as String? ?? '',
        userId: json['userId']?.toString() ?? '',
        fullName: json['fullName'] as String? ?? '',
      );
}
