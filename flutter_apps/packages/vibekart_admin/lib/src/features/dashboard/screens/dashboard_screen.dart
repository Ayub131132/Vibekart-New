import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('COMMAND CENTER'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ANALYTICS OVERVIEW',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
                color: Colors.white54,
              ),
            ),
            const SizedBox(height: 24),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.5,
              children: const [
                _StatCard(title: 'REVENUE', value: '₹0', icon: LucideIcons.indianRupee, color: VibeTheme.accentBlue),
                _StatCard(title: 'ORDERS', value: '0', icon: LucideIcons.shoppingBag, color: VibeTheme.accentPurple),
                _StatCard(title: 'PRODUCTS', value: '0', icon: LucideIcons.package, color: VibeTheme.successGreen),
                _StatCard(title: 'USERS', value: '0', icon: LucideIcons.users, color: Colors.orange),
              ],
            ),
            const SizedBox(height: 40),
            const Text(
              'QUICK ACTIONS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
                color: Colors.white54,
              ),
            ),
            const SizedBox(height: 24),
            VibeCard(
              child: Column(
                children: [
                  _ActionTile(
                    icon: LucideIcons.plusCircle,
                    title: 'Add New Product',
                    onTap: () {},
                  ),
                  const Divider(color: Colors.white05, height: 32),
                  _ActionTile(
                    icon: LucideIcons.ticket,
                    title: 'Create Coupon',
                    onTap: () {},
                  ),
                  const Divider(color: Colors.white05, height: 32),
                  _ActionTile(
                    icon: LucideIcons.bell,
                    title: 'Send Promotion',
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return VibeCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, size: 16, color: color),
              const Icon(LucideIcons.trendingUp, size: 12, color: VibeTheme.successGreen),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              Text(
                title,
                style: const TextStyle(fontSize: 10, color: Colors.white38, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: VibeTheme.accentBlue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: VibeTheme.accentBlue, size: 18),
          ),
          const SizedBox(width: 16),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          const Spacer(),
          const Icon(LucideIcons.chevronRight, size: 16, color: Colors.white24),
        ],
      ),
    );
  }
}
