import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../providers/cart_provider.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartState = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('YOUR CART'),
        centerTitle: true,
      ),
      body: cartState.items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.shoppingBag, size: 64, color: Colors.white24),
                  const SizedBox(height: 24),
                  const Text(
                    'Your cart is empty',
                    style: TextStyle(fontSize: 18, color: Colors.white54),
                  ),
                  const SizedBox(height: 24),
                  VibeButton(
                    text: 'START SHOPPING',
                    onPressed: () => context.go('/'),
                    fullWidth: false,
                  ),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: cartState.items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final item = cartState.items[index];
                return _CartItemTile(item: item);
              },
            ),
      bottomNavigationBar: cartState.items.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: VibeTheme.bgDarkGray,
                border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1))),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'TOTAL',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                            color: Colors.white54,
                          ),
                        ),
                        Text(
                          '₹${cartState.subtotal.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: VibeTheme.accentBlue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    VibeButton(
                      text: 'CHECKOUT',
                      onPressed: () => context.push('/checkout'),
                      icon: LucideIcons.chevronRight,
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _CartItemTile extends ConsumerWidget {
  final CartItem item;
  const _CartItemTile({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return VibeCard(
      padding: EdgeInsets.zero,
      child: IntrinsicHeight(
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
              child: Image.network(
                item.image,
                width: 100,
                fit: BoxFit.cover,
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹${item.price}',
                      style: const TextStyle(color: VibeTheme.accentBlue, fontWeight: FontWeight.bold),
                    ),
                    const Spacer(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            _QtyButton(
                              icon: LucideIcons.minus,
                              onPressed: () => ref
                                  .read(cartProvider.notifier)
                                  .updateQuantity(item.id, item.quantity - 1),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              '${item.quantity}',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(width: 12),
                            _QtyButton(
                              icon: LucideIcons.plus,
                              onPressed: () => ref
                                  .read(cartProvider.notifier)
                                  .updateQuantity(item.id, item.quantity + 1),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.trash2, size: 20, color: VibeTheme.errorRed),
                          onPressed: () => ref.read(cartProvider.notifier).removeItem(item.id),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;

  const _QtyButton({required this.icon, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 16, color: Colors.white),
      ),
    );
  }
}
