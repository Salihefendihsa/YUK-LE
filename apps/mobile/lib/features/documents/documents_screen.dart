import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

enum DocStatus { approved, pending, rejected, missing }

class DocumentsScreen extends StatelessWidget {
  const DocumentsScreen({super.key});

  static const _docs = [
    _DocItem(
      title: 'Sürücü Belgesi',
      subtitle: 'Ehliyet (B, C, D sınıfı)',
      icon: Icons.credit_card_rounded,
      status: DocStatus.approved,
    ),
    _DocItem(
      title: 'Araç Ruhsatı',
      subtitle: 'Tescil belgesi',
      icon: Icons.directions_car_outlined,
      status: DocStatus.pending,
    ),
    _DocItem(
      title: 'Zorunlu Trafik Sigortası',
      subtitle: 'Poliçe belgesi',
      icon: Icons.security_outlined,
      status: DocStatus.approved,
    ),
    _DocItem(
      title: 'Psikoteknik Belgesi',
      subtitle: 'Ticari araç için gerekli',
      icon: Icons.psychology_outlined,
      status: DocStatus.missing,
    ),
    _DocItem(
      title: 'Taşıyıcı Yetki Belgesi',
      subtitle: 'K1/K2/L1/L2 belgesi',
      icon: Icons.verified_outlined,
      status: DocStatus.rejected,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.go('/dashboard'),
        ),
        title: const Text('Belgelerim'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _StatusSummary(docs: _docs),
          const SizedBox(height: 24),
          Text(
            'Yüklenen Belgeler',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            'Belgelerinizin durumunu buradan takip edin',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          ...(_docs.map((doc) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _DocCard(doc: doc),
          ))),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _StatusSummary extends StatelessWidget {
  final List<_DocItem> docs;
  const _StatusSummary({required this.docs});

  @override
  Widget build(BuildContext context) {
    final approved = docs.where((d) => d.status == DocStatus.approved).length;
    final total = docs.length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.card, AppColors.brand.withValues(alpha: 0.1)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Belge Durumu',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  '$approved / $total belge onaylı',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: approved / total,
                    backgroundColor: AppColors.cardBorder,
                    valueColor: const AlwaysStoppedAnimation(AppColors.success),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 60,
                height: 60,
                child: CircularProgressIndicator(
                  value: approved / total,
                  backgroundColor: AppColors.cardBorder,
                  valueColor: const AlwaysStoppedAnimation(AppColors.success),
                  strokeWidth: 5,
                ),
              ),
              Text(
                '%${((approved / total) * 100).toInt()}',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: AppColors.success,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DocItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final DocStatus status;
  const _DocItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.status,
  });
}

class _DocCard extends StatelessWidget {
  final _DocItem doc;
  const _DocCard({required this.doc});

  (Color, Color, String, IconData) get _statusStyle {
    switch (doc.status) {
      case DocStatus.approved:
        return (
          AppColors.success,
          AppColors.success.withValues(alpha: 0.12),
          'Onaylandı',
          Icons.check_circle_rounded,
        );
      case DocStatus.pending:
        return (
          AppColors.warning,
          AppColors.warning.withValues(alpha: 0.12),
          'İnceleniyor',
          Icons.hourglass_top_rounded,
        );
      case DocStatus.rejected:
        return (
          AppColors.error,
          AppColors.error.withValues(alpha: 0.12),
          'Reddedildi',
          Icons.cancel_rounded,
        );
      case DocStatus.missing:
        return (
          AppColors.textMuted,
          AppColors.cardBorder,
          'Yüklenmedi',
          Icons.upload_file_rounded,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final (color, bg, label, statusIcon) = _statusStyle;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.brand.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(doc.icon, color: AppColors.brand, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(doc.title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 2),
                Text(doc.subtitle, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, color: color, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      label,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: color,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              if (doc.status == DocStatus.missing ||
                  doc.status == DocStatus.rejected) ...[
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () {},
                  child: Text(
                    'Yükle',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.brand,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
