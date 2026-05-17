class Product {
  final String id;
  final String name;
  final double price;
  final String description;
  final String image;
  final String category;
  final int stock;

  Product({
    required this.id,
    required this.name,
    required this.price,
    required this.description,
    required this.image,
    required this.category,
    required this.stock,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      description: json['description'] as String,
      image: json['image'] as String,
      category: json['category'] as String,
      stock: (json['stock'] as num).toInt(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'description': description,
      'image': image,
      'category': category,
      'stock': stock,
    };
  }
}

class CartItem extends Product {
  final int quantity;

  CartItem({
    required super.id,
    required super.name,
    required super.price,
    required super.description,
    required super.image,
    required super.category,
    required super.stock,
    required this.quantity,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'] as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      description: json['description'] as String,
      image: json['image'] as String,
      category: json['category'] as String,
      stock: (json['stock'] as num).toInt(),
      quantity: (json['quantity'] as num).toInt(),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final data = super.toJson();
    data['quantity'] = quantity;
    return data;
  }
}
