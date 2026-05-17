import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('PROFILE'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, color: VibeTheme.errorRed),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: userProfileAsync.when(
        data: (profile) => profile == null
            ? const Center(child: Text('Profile not found'))
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    Stack(
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: VibeTheme.accentBlue, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: VibeTheme.accentBlue.withOpacity(0.2),
                                blurRadius: 20,
                              ),
                            ],
                            image: DecorationImage(
                              image: NetworkImage(profile.photoURL),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: VibeTheme.accentBlue,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.camera, size: 16, color: Colors.black),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      profile.displayName,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '@${profile.username}',
                      style: const TextStyle(color: VibeTheme.accentBlue, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '"${profile.bio}"',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white70, fontStyle: FontStyle.italic),
                    ),
                    const SizedBox(height: 40),
                    
                    VibeCard(
                      child: Column(
                        children: [
                          _ProfileTile(
                            icon: LucideIcons.package,
                            title: 'My Orders',
                            subtitle: '${profile.totalOrders} total orders',
                            onTap: () => context.push('/orders'),
                          ),
                          const Divider(color: Colors.white05, height: 32),
                          _ProfileTile(
                            icon: LucideIcons.mapPin,
                            title: 'Delivery Address',
                            subtitle: profile.addressLine ?? 'No address saved',
                            onTap: () {},
                          ),
                          const Divider(color: Colors.white05, height: 32),
                          _ProfileTile(
                            icon: LucideIcons.settings,
                            title: 'Settings',
                            subtitle: 'Preferences & Notifications',
                            onTap: () {},
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                    VibeButton(
                      text: 'EDIT PROFILE',
                      onPressed: () {},
                      isSecondary: true,
                    ),
                  ],
                ),
              ),
        loading: () => const Center(child: CircularProgressIndicator(color: VibeTheme.accentBlue)),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ProfileTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: VibeTheme.accentBlue, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.white54)),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronRight, size: 16, color: Colors.white24),
        ],
      ),
    );
  }
}
