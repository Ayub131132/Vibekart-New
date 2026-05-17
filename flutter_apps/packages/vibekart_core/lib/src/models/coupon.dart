enum CouponType {
  percentage,
  fixed;

  static CouponType fromString(String type) {
    return type.toLowerCase() == 'fixed' ? CouponType.fixed : CouponType.percentage;
  }

  String toJson() => name;
}

class Coupon {
  final String code;
  final double discount;
  final CouponType type;
  final String? expiryDate;

  Coupon({
    required this.code,
    required this.discount,
    required this.type,
    this.expiryDate,
  });

  factory Coupon.fromJson(Map<String, dynamic> json) {
    return Coupon(
      code: json['code'] as String,
      discount: (json['discount'] as num).toDouble(),
      type: CouponType.fromString(json['type'] as String? ?? 'percentage'),
      expiryDate: json['expiryDate'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'discount': discount,
      'type': type.toJson(),
      'expiryDate': expiryDate,
    };
  }
}
