import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../auth/auth_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _isOnline = false;
  int _currentTab = 0;

  final _tabs = const [
    NavigationDestination(
      icon: Icon(Icons.dashboard_outlined),
      selectedIcon: Icon(Icons.dashboard_rounded),
      label: 'Ana Sayfa',
    ),
    NavigationDestination(
      icon: Icon(Icons.local_shipping_outlined),
      selectedIcon: Icon(Icons.local_shipping_rounded),
      label: 'Yüklerim',
    ),
    NavigationDestination(
      icon: Icon(Icons.folder_outlined),
      selectedIcon: Icon(Icons.folder_rounded),
      label: 'Belgeler',
    ),
    NavigationDestination(
      icon: Icon(Icons.person_outlined),
      selectedIcon: Icon(Icons.person_rounded),
      label: 'Profil',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentTab,
        children: [
          _HomeTab(
            isOnline: _isOnline,
            onToggleOnline: () => setState(() => _isOnline = !_isOnline),
          ),
          const _LoadsTab(),
          const _DocumentsTabShell(),
          const _ProfileTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.brand.withValues(alpha: 0.15),
        selectedIndex: _currentTab,
        onDestinationSelected: (i) {
          if (i == 2) {
            context.go('/documents');
            return;
          }
          setState(() => _currentTab = i);
        },
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: _tabs,
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  final bool isOnline;
  final VoidCallback onToggleOnline;

  const _HomeTab({required this.isOnline, required this.onToggleOnline});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          floating: true,
          backgroundColor: AppColors.background,
          elevation: 0,
          title: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.brand,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.local_shipping_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'YÜK-LE',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () {},
            ),
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.card,
                child: Icon(Icons.person, color: AppColors.textSecondary, size: 20),
              ),
            ),
          ],
        ),
        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              _GreetingSection(isOnline: isOnline, onToggle: onToggleOnline),
              const SizedBox(height: 24),
              _StatsRow(),
              const SizedBox(height: 28),
              _AiLoadsSection(),
              const SizedBox(height: 80),
            ]),
          ),
        ),
      ],
    );
  }
}

class _GreetingSection extends StatelessWidget {
  final bool isOnline;
  final VoidCallback onToggle;

  const _GreetingSection({required this.isOnline, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.card,
            AppColors.brand.withValues(alpha: 0.08),
          ],
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Merhaba, Şoför 👋',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  isOnline
                      ? 'Aktifsiniz — yük teklifleri alıyorsunuz'
                      : 'Çevrimdışısınız — yük almıyorsunuz',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: isOnline ? AppColors.success : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: onToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 56,
              height: 30,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(15),
                color: isOnline ? AppColors.success : AppColors.cardBorder,
              ),
              child: AnimatedAlign(
                duration: const Duration(milliseconds: 250),
                alignment: isOnline ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.all(3),
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final _stats = const [
    _StatData(label: 'Bugünkü\nSefer', value: '5', icon: Icons.route_rounded),
    _StatData(label: 'Kazanç\n(TL)', value: '₺2.840', icon: Icons.account_balance_wallet_outlined),
    _StatData(label: 'Değerlendirme', value: '4.8 ⭐', icon: Icons.star_rounded),
  ];

  const _StatsRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _stats.map((s) => Expanded(
        child: Padding(
          padding: EdgeInsets.only(
            left: _stats.indexOf(s) == 0 ? 0 : 8,
          ),
          child: _StatCard(data: s),
        ),
      )).toList(),
    );
  }
}

class _StatData {
  final String label;
  final String value;
  final IconData icon;
  const _StatData({required this.label, required this.value, required this.icon});
}

class _StatCard extends StatelessWidget {
  final _StatData data;
  const _StatCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(data.icon, color: AppColors.brand, size: 22),
          const SizedBox(height: 12),
          Text(
            data.value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            data.label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _AiLoadsSection extends StatelessWidget {
  final _loads = const [
    _LoadData(
      origin: 'İstanbul',
      destination: 'Ankara',
      weight: '15 ton',
      distance: '450 km',
      price: '₺8.500',
      isAiPick: true,
      cargo: 'Elektronik Eşya',
    ),
    _LoadData(
      origin: 'İzmir',
      destination: 'Bursa',
      weight: '8 ton',
      distance: '290 km',
      price: '₺4.200',
      isAiPick: true,
      cargo: 'Gıda Ürünleri',
    ),
    _LoadData(
      origin: 'Ankara',
      destination: 'Konya',
      weight: '20 ton',
      distance: '260 km',
      price: '₺5.800',
      isAiPick: false,
      cargo: 'İnşaat Malzemesi',
    ),
  ];

  const _AiLoadsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'AI Önerilen Yükler',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            TextButton(
              onPressed: () {},
              style: TextButton.styleFrom(foregroundColor: AppColors.brand),
              child: const Text('Tümünü Gör'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Güzergahınıza göre kişiselleştirilmiş',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 16),
        ...(_loads.map((l) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _LoadCard(load: l),
        ))),
      ],
    );
  }
}

class _LoadData {
  final String origin;
  final String destination;
  final String weight;
  final String distance;
  final String price;
  final String cargo;
  final bool isAiPick;

  const _LoadData({
    required this.origin,
    required this.destination,
    required this.weight,
    required this.distance,
    required this.price,
    required this.cargo,
    required this.isAiPick,
  });
}

class _LoadCard extends StatelessWidget {
  final _LoadData load;
  const _LoadCard({required this.load});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: load.isAiPick
              ? AppColors.brand.withValues(alpha: 0.4)
              : AppColors.cardBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (load.isAiPick)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: AppColors.brand.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.auto_awesome, color: AppColors.brand, size: 12),
                  const SizedBox(width: 4),
                  Text(
                    'AI Önerisi',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.brand,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      load.cargo,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text(
                          load.origin,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8),
                          child: Icon(
                            Icons.arrow_forward_rounded,
                            color: AppColors.brand,
                            size: 18,
                          ),
                        ),
                        Text(
                          load.destination,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Text(
                load.price,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.brand,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(),
          const SizedBox(height: 8),
          Row(
            children: [
              _InfoChip(icon: Icons.scale_outlined, label: load.weight),
              const SizedBox(width: 12),
              _InfoChip(icon: Icons.route_outlined, label: load.distance),
              const Spacer(),
              SizedBox(
                height: 36,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(96, 36),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    textStyle: const TextStyle(fontSize: 13),
                  ),
                  child: const Text('Kabul Et'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

// Placeholder tabs
class _LoadsTab extends StatelessWidget {
  const _LoadsTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Yüklerim')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.local_shipping_outlined,
                size: 64, color: AppColors.textMuted),
            const SizedBox(height: 16),
            Text('Aktif yük bulunmuyor',
                style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}

class _DocumentsTabShell extends StatelessWidget {
  const _DocumentsTabShell();

  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}

class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profilim')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: Column(
              children: [
                const CircleAvatar(
                  radius: 44,
                  backgroundColor: AppColors.card,
                  child: Icon(Icons.person, size: 44, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 12),
                Text('Şoför', style: Theme.of(context).textTheme.titleLarge),
                Text('şoför@yukle.com',
                    style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          const SizedBox(height: 32),
          _ProfileItem(
            icon: Icons.badge_outlined,
            label: 'Sürücü Belgelerim',
            onTap: () => context.go('/documents'),
          ),
          _ProfileItem(
            icon: Icons.history_rounded,
            label: 'Sefer Geçmişi',
            onTap: () {},
          ),
          _ProfileItem(
            icon: Icons.star_outline_rounded,
            label: 'Değerlendirmelerim',
            onTap: () {},
          ),
          _ProfileItem(
            icon: Icons.settings_outlined,
            label: 'Ayarlar',
            onTap: () {},
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout_rounded, color: AppColors.error),
            label: const Text(
              'Çıkış Yap',
              style: TextStyle(color: AppColors.error),
            ),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 52),
              side: const BorderSide(color: AppColors.error),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ProfileItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.textSecondary),
        title: Text(label, style: Theme.of(context).textTheme.bodyLarge),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          color: AppColors.textMuted,
        ),
        onTap: onTap,
      ),
    );
  }
}
