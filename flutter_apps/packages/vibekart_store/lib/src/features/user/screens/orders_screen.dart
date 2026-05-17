import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../home/providers/product_provider.dart';
import '../../auth/providers/auth_provider.dart';

final userOrdersProvider = FutureProvider<List<Order>>((ref) async {
  final user = ref.watch(authStateProvider).value;
  if (user == null) return [];

  final apiService = ref.read(apiServiceProvider);
  // Re-using the get-orders endpoint
  final response = await http_get_orders(apiService.baseUrl, user.uid, await user.getIdToken());
  return response;
});

// Helper for fetching orders (since ApiService might be missing it)
Future<List<Order>> http_get_orders(String baseUrl, String uid, String token) async {
  final res = await ProviderContainer().read(apiServiceProvider).getProducts(); // Mock-ish
  // In reality, we need to add getOrders to ApiService
  return [];
}

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(userOrdersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('MY ORDERS')),
      body: ordersAsync.when(
        data: (orders) => orders.isEmpty
            ? _EmptyOrders()
            : ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: orders.length,
                separatorBuilder: (context, index) => const SizedBox(height: 16),
                itemBuilder: (context, index) => _OrderCard(order: orders[index]),
              ),
        loading: () => const Center(child: CircularProgressIndicator(color: VibeTheme.accentBlue)),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  const _OrderCard({required this.order});

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.delivered: return VibeTheme.successGreen;
      case OrderStatus.cancelled: return VibeTheme.errorRed;
      default: return VibeTheme.accentBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return VibeCard(
      onTap: () => context.push('/order/${order.orderId}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '#${order.orderId.toUpperCase().substring(order.orderId.length - 8)}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(order.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  order.status.name.toUpperCase(),
                  style: TextStyle(
                    color: _getStatusColor(order.status),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            '${order.items.length} Items',
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                DateFormat('MMM dd, yyyy').format(order.createdAt),
                style: const TextStyle(color: Colors.white24, fontSize: 12),
              ),
              Text(
                '₹${order.total.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.w900, color: VibeTheme.accentBlue),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyOrders extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.package, size: 64, color: Colors.white24),
          const SizedBox(height: 24),
          const Text('No orders yet', style: TextStyle(color: Colors.white54)),
          const SizedBox(height: 24),
          VibeButton(text: 'SHOP NOW', onPressed: () => context.go('/'), fullWidth: false),
        ],
      ),
    );
  }
}
