import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../features/dashboard/screens/dashboard_screen.dart'; // To use action tiles
import '../../../../../vibekart_store/lib/src/features/home/providers/product_provider.dart';

class ProductListScreen extends ConsumerWidget {
  const ProductListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('MANAGE PRODUCTS'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plusCircle, color: VibeTheme.accentBlue),
            onPressed: () {},
          ),
        ],
      ),
      body: productsAsync.when(
        data: (products) => ListView.separated(
          padding: const EdgeInsets.all(24),
          itemCount: products.length,
          separatorBuilder: (context, index) => const SizedBox(height: 16),
          itemBuilder: (context, index) {
            final product = products[index];
            return _AdminProductTile(product: product);
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }
}

class _AdminProductTile extends StatelessWidget {
  final Product product;
  const _AdminProductTile({required this.product});

  @override
  Widget build(BuildContext context) {
    return VibeCard(
      padding: EdgeInsets.zero,
      child: IntrinsicHeight(
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
              child: Image.network(
                product.image,
                width: 80,
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
                      product.name,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '₹${product.price} | Stock: ${product.stock}',
                      style: const TextStyle(color: Colors.white54, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(LucideIcons.edit3, size: 18, color: VibeTheme.accentBlue),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.trash2, size: 18, color: VibeTheme.errorRed),
                    onPressed: () {},
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
