import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'src/routing/admin_router.dart';

void main() {
  runApp(
    const ProviderScope(
      child: VibekartAdminApp(),
    ),
  );
}

class VibekartAdminApp extends ConsumerWidget {
  const VibekartAdminApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(adminRouter);

    return MaterialApp.router(
      title: 'Vibekart Admin',
      theme: VibeTheme.darkTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
