import 'package:flutter_test/flutter_test.dart';
import 'package:yukle_mobile/main.dart';

void main() {
  testWidgets('Login screen renders', (WidgetTester tester) async {
    await tester.pumpWidget(const YukleApp());
    expect(find.text('YÜK-LE'), findsOneWidget);
    expect(find.text('Giriş Yap'), findsWidgets);
  });
}
