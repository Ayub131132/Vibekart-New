import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'providers/product_provider.dart';
import '../../cart/providers/cart_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'VIBEKART',
          style: VibeTheme.darkTheme.textTheme.displayLarge?.copyWith(fontSize: 20),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.search),
            onPressed: () {},
          ),
        ],
      ),
      body: productsAsync.when(
        data: (products) => GridView.builder(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.65,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: products.length,
          itemBuilder: (context, index) {
            final product = products[index];
            return _ProductCard(product: product);
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator(color: VibeTheme.accentBlue)),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.wifiOff, size: 48, color: VibeTheme.errorRed),
              const SizedBox(height: 16),
              const Text('Failed to load vibes'),
              TextButton(
                onPressed: () => ref.refresh(productsProvider),
                child: const Text('RETRY'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductCard extends ConsumerWidget {
  final Product product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () => context.go('/product', extra: product),
      child: Container(
        decoration: BoxDecoration(
          color: VibeTheme.bgDarkGray.withOpacity(0.7),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: Hero(
                  tag: 'product-${product.id}',
                  child: Image.network(
                    product.image,
                    fit: BoxFit.cover,
                    width: double.infinity,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: VibeTheme.bgBlack,
                      child: const Center(child: Icon(LucideIcons.image)),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${product.price}',
                    style: const TextStyle(
                      color: VibeTheme.accentBlue,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        ref.read(cartProvider.notifier).addItem(product);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Added ${product.name} to cart'),
                            backgroundColor: VibeTheme.successGreen,
                            duration: const Duration(seconds: 1),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: VibeTheme.accentBlue.withOpacity(0.1),
                        side: const BorderSide(color: VibeTheme.accentBlue),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: const Icon(LucideIcons.shoppingCart, size: 18),
                    ),
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
