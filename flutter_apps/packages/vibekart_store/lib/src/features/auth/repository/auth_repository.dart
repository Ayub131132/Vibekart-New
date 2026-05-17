import 'package:firebase_auth/firebase_auth.dart';
import 'package:vibekart_core/vibekart_core.dart';

class AuthRepository {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final ApiService _apiService;

  AuthRepository(this._apiService);

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<void> sendOtp(String email, String type) async {
    await _apiService.sendOtp(email, type);
  }

  Future<void> verifyOtp(String email, String otp) async {
    final customToken = await _apiService.verifyOtp(email, otp);
    await _auth.signInWithCustomToken(customToken);
  }

  Future<DbUser?> syncProfile() async {
    final user = _auth.currentUser;
    if (user == null) return null;

    try {
      return await _apiService.getUserProfile(user.uid);
    } catch (e) {
      // If 404, we might need to create it (though backend should handle it in OTP verify)
      // For Google login or edge cases:
      if (e.toString().contains('404') || e.toString().contains('not found')) {
         await _apiService.createProfile(
           email: user.email!,
           displayName: user.displayName,
           photoURL: user.photoURL,
         );
         return await _apiService.getUserProfile(user.uid);
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    await _auth.signOut();
  }
}
