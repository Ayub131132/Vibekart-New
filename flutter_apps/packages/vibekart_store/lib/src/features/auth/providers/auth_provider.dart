import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:vibekart_core/vibekart_core.dart';
import '../repository/auth_repository.dart';
import '../../home/providers/product_provider.dart';

final authRepositoryProvider = Provider((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthRepository(apiService);
});

final authStateProvider = StreamProvider((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

final userProfileProvider = FutureProvider<DbUser?>((ref) async {
  final authState = ref.watch(authStateProvider);
  
  if (authState.value == null) return null;
  
  return ref.watch(authRepositoryProvider).syncProfile();
});

class AuthController extends StateNotifier<AsyncValue<void>> {
  final AuthRepository _repository;
  final Ref _ref;

  AuthController(this._repository, this._ref) : super(const AsyncValue.data(null));

  Future<void> sendOtp(String email, String type) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.sendOtp(email, type));
  }

  Future<void> verifyOtp(String email, String otp) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.verifyOtp(email, otp));
    if (!state.hasError) {
      _ref.invalidate(userProfileProvider);
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.logout());
    _ref.invalidate(userProfileProvider);
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AsyncValue<void>>((ref) {
  return AuthController(ref.watch(authRepositoryProvider), ref);
});
