import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';

final apiServiceProvider = Provider((ref) => ApiService(
  baseUrl: 'http://localhost:5000', // Update with your actual backend URL
));

final productsProvider = FutureProvider<List<Product>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getProducts();
});
