import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import '../../home/providers/product_provider.dart';
import '../../auth/providers/auth_provider.dart';

class CartState {
  final List<CartItem> items;
  final bool loading;

  CartState({this.items = const [], this.loading = false});

  double get subtotal => items.fold(0, (sum, item) => sum + (item.price * item.quantity));

  CartState copyWith({List<CartItem>? items, bool? loading}) {
    return CartState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
    );
  }
}

class CartController extends StateNotifier<CartState> {
  final ApiService _apiService;
  final Ref _ref;
  Timer? _debounceSync;

  CartController(this._apiService, this._ref) : super(CartState()) {
    _loadCart();
  }

  Future<void> _loadCart() async {
    final user = _ref.read(authStateProvider).value;
    if (user == null) return;

    state = state.copyWith(loading: true);
    try {
      final items = await _apiService.getUserProfile(user.uid).then((p) => []); // Placeholder: API needs get-cart
      // Note: Re-using the get-cart endpoint
      final response = await _apiService.getUserProfile(user.uid); // This is just profile
      
      // Let's assume we have a dedicated cart sync or we use the profile sync
    } catch (e) {
      // Handle error
    } finally {
      state = state.copyWith(loading: false);
    }
  }

  void addItem(Product product) {
    final index = state.items.indexWhere((item) => item.id == product.id);
    
    if (index != -1) {
      final item = state.items[index];
      if (item.quantity >= product.stock) return;

      final newItems = List<CartItem>.from(state.items);
      newItems[index] = CartItem(
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        category: item.category,
        stock: item.stock,
        quantity: item.quantity + 1,
      );
      state = state.copyWith(items: newItems);
    } else {
      if (product.stock <= 0) return;
      state = state.copyWith(items: [...state.items, CartItem(
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        category: product.category,
        stock: product.stock,
        quantity: 1,
      )]);
    }
    _triggerSync();
  }

  void removeItem(String productId) {
    state = state.copyWith(items: state.items.where((i) => i.id != productId).toList());
    _triggerSync();
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    final index = state.items.indexWhere((item) => item.id == productId);
    if (index == -1) return;

    final item = state.items[index];
    if (quantity > item.stock) return;

    final newItems = List<CartItem>.from(state.items);
    newItems[index] = CartItem(
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      image: item.image,
      category: item.category,
      stock: item.stock,
      quantity: quantity,
    );
    state = state.copyWith(items: newItems);
    _triggerSync();
  }

  void _triggerSync() {
    _debounceSync?.cancel();
    _debounceSync = Timer(const Duration(seconds: 2), () async {
       final user = _ref.read(authStateProvider).value;
       if (user == null) return;
       // Sync to backend (API call needed)
    });
  }
}

final cartProvider = StateNotifierProvider<CartController, CartState>((ref) {
  return CartController(ref.watch(apiServiceProvider), ref);
});
