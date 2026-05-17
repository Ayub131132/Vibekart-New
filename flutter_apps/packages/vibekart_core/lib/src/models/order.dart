import 'product.dart';

enum OrderStatus {
  confirmed,
  packed,
  shipped,
  outForDelivery,
  delivered,
  cancelled;

  static OrderStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed': return OrderStatus.confirmed;
      case 'packed': return OrderStatus.packed;
      case 'shipped': return OrderStatus.shipped;
      case 'out for delivery': return OrderStatus.outForDelivery;
      case 'delivered': return OrderStatus.delivered;
      case 'cancelled': return OrderStatus.cancelled;
      default: return OrderStatus.confirmed;
    }
  }

  String toJson() {
    switch (this) {
      case OrderStatus.confirmed: return 'confirmed';
      case OrderStatus.packed: return 'packed';
      case OrderStatus.shipped: return 'shipped';
      case OrderStatus.outForDelivery: return 'out for delivery';
      case OrderStatus.delivered: return 'delivered';
      case OrderStatus.cancelled: return 'cancelled';
    }
  }
}

class Order {
  final String orderId;
  final String uid;
  final List<CartItem> items;
  final double? subtotal;
  final double? discount;
  final double total;
  final String? couponCode;
  final OrderStatus status;
  final DateTime createdAt;
  final String address;
  final String paymentMethod;
  final String? paymentStatus;
  final String? razorpayOrderId;

  Order({
    required this.orderId,
    required this.uid,
    required this.items,
    this.subtotal,
    this.discount,
    required this.total,
    this.couponCode,
    required this.status,
    required this.createdAt,
    required this.address,
    required this.paymentMethod,
    this.paymentStatus,
    this.razorpayOrderId,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final createdAtJson = json['createdAt'] as Map<String, dynamic>;
    final seconds = createdAtJson['_seconds'] as int;
    
    return Order(
      orderId: json['orderId'] as String,
      uid: json['uid'] as String,
      items: (json['items'] as List)
          .map((i) => CartItem.fromJson(i as Map<String, dynamic>))
          .toList(),
      subtotal: (json['subtotal'] as num?)?.toDouble(),
      discount: (json['discount'] as num?)?.toDouble(),
      total: (json['total'] as num).toDouble(),
      couponCode: json['couponCode'] as String?,
      status: OrderStatus.fromString(json['status'] as String),
      createdAt: DateTime.fromMillisecondsSinceEpoch(seconds * 1000),
      address: json['address'] as String,
      paymentMethod: json['paymentMethod'] as String,
      paymentStatus: json['paymentStatus'] as String?,
      razorpayOrderId: json['razorpayOrderId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'uid': uid,
      'items': items.map((e) => e.toJson()).toList(),
      'subtotal': subtotal,
      'discount': discount,
      'total': total,
      'couponCode': couponCode,
      'status': status.toJson(),
      'address': address,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'razorpayOrderId': razorpayOrderId,
    };
  }
}
