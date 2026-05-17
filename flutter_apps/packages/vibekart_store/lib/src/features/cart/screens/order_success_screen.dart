import 'package:flutter/material.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';

class OrderSuccessScreen extends StatelessWidget {
  final String orderId;
  const OrderSuccessScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: VibeTheme.successGreen.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.checkCircle,
                  size: 80,
                  color: VibeTheme.successGreen,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'VIBE SECURED',
                style: VibeTheme.darkTheme.textTheme.displayLarge?.copyWith(fontSize: 28),
              ),
              const SizedBox(height: 16),
              Text(
                'Order #$orderId has been placed successfully.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
              ),
              const SizedBox(height: 48),
              VibeButton(
                text: 'VIEW MY ORDERS',
                onPressed: () => context.go('/orders'),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => context.go('/'),
                child: const Text('Back to Home', style: TextStyle(color: Colors.white54)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
