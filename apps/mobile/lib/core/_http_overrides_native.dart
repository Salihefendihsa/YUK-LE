import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';

void setupDebugHttpClient(Dio dio) {
  (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () =>
      HttpClient()..badCertificateCallback = (cert, host, port) => true;
}
