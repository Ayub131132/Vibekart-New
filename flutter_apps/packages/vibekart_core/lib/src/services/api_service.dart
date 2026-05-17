import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';
import '../models/order.dart';
import '../models/user.dart';
import '../models/coupon.dart';

class ApiService {
  final String baseUrl;
  final String? authToken;

  ApiService({required this.baseUrl, this.authToken});

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };

  Future<List<Product>> getProducts({String? category, String? search, String? lastId, int limit = 8}) async {
    final params = {
      if (category != null && category != 'All') 'category': category,
      if (search != null) 'search': search,
      if (lastId != null) 'lastId': lastId,
      'limit': limit.toString(),
    };
    
    final uri = Uri.parse('$baseUrl/get-products').replace(queryParameters: params);
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['products'] as List).map((p) => Product.fromJson(p)).toList();
    } else {
      throw Exception('Failed to load products');
    }
  }

  Future<DbUser> getUserProfile(String uid) async {
    final response = await http.get(Uri.parse('$baseUrl/user-profile/$uid'), headers: _headers);

    if (response.statusCode == 200) {
      return DbUser.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load profile');
    }
  }

  Future<void> createProfile({required String email, String? displayName, String? photoURL}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/create-profile'),
      headers: _headers,
      body: jsonEncode({
        'email': email,
        'displayName': displayName,
        'photoURL': photoURL,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to create profile');
    }
  }

  Future<void> sendOtp(String email, String type) async {
    final response = await http.post(
      Uri.parse('$baseUrl/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'type': type}),
    );

    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['message'] ?? 'Failed to send OTP');
    }
  }

  Future<String> verifyOtp(String email, String otp) async {
    final response = await http.post(
      Uri.parse('$baseUrl/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'otp': otp}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['token'] as String;
    } else {
      final data = jsonDecode(response.body);
      throw Exception(data['message'] ?? 'Invalid OTP');
    }
  }

  Future<Coupon> verifyCoupon(String code) async {
    final response = await http.post(
      Uri.parse('$baseUrl/verify-coupon'),
      headers: _headers,
      body: jsonEncode({'code': code}),
    );

    if (response.statusCode == 200) {
      return Coupon.fromJson(jsonDecode(response.body));
    } else {
      final data = jsonDecode(response.body);
      throw Exception(data['message'] ?? 'Invalid coupon');
    }
  }

  Future<Map<String, dynamic>> placeOrder({
    required List<CartItem> items,
    required String address,
    required String paymentMethod,
    String? couponCode,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/place-order'),
      headers: _headers,
      body: jsonEncode({
        'items': items.map((e) => {'id': e.id, 'quantity': e.quantity}).toList(),
        'address': address,
        'paymentMethod': paymentMethod,
        if (couponCode != null) 'couponCode': couponCode,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final data = jsonDecode(response.body);
      throw Exception(data['message'] ?? 'Failed to place order');
    }
  }
}
