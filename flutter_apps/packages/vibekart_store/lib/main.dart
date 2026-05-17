import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'src/routing/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Note: Firebase.initializeApp() requires platform-specific configuration 
  // (google-services.json / GoogleService-Info.plist).
  // For now, we assume the environment is set up.
  // await Firebase.initializeApp();

  runApp(
    const ProviderScope(
      child: VibekartStoreApp(),
    ),
  );
}

class VibekartStoreApp extends ConsumerWidget {
  const VibekartStoreApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Vibekart Store',
      theme: VibeTheme.darkTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
