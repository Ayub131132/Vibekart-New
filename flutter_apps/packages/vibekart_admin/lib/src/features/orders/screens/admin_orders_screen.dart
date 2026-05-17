import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';

class AdminOrdersScreen extends ConsumerWidget {
  const AdminOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // In a real app, this would use an adminAllOrdersProvider
    return Scaffold(
      appBar: AppBar(title: const Text('ORDER MANAGEMENT')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.shoppingBag, size: 64, color: Colors.white10),
            SizedBox(height: 24),
            Text('Processing Live Feed...', style: TextStyle(color: Colors.white38)),
          ],
        ),
      ),
    );
  }
}
