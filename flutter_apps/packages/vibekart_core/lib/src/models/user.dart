class DbUser {
  final String uid;
  final String numericUid;
  final String email;
  final String displayName;
  final String username;
  final String photoURL;
  final int totalOrders;
  final String bio;
  final String? addressLine;
  final String? selectedState;
  final String? selectedDistrict;
  final String? villageCity;
  final String? pinCode;
  final String? phoneNumber;

  DbUser({
    required this.uid,
    required this.numericUid,
    required this.email,
    required this.displayName,
    required this.username,
    required this.photoURL,
    required this.totalOrders,
    required this.bio,
    this.addressLine,
    this.selectedState,
    this.selectedDistrict,
    this.villageCity,
    this.pinCode,
    this.phoneNumber,
  });

  factory DbUser.fromJson(Map<String, dynamic> json) {
    return DbUser(
      uid: json['uid'] as String,
      numericUid: json['numericUid'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      username: json['username'] as String,
      photoURL: json['photoURL'] as String,
      totalOrders: (json['totalOrders'] as num).toInt(),
      bio: json['bio'] as String,
      addressLine: json['addressLine'] as String?,
      selectedState: json['selectedState'] as String?,
      selectedDistrict: json['selectedDistrict'] as String?,
      villageCity: json['villageCity'] as String?,
      pinCode: json['pinCode'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'numericUid': numericUid,
      'email': email,
      'displayName': displayName,
      'username': username,
      'photoURL': photoURL,
      'totalOrders': totalOrders,
      'bio': bio,
      'addressLine': addressLine,
      'selectedState': selectedState,
      'selectedDistrict': selectedDistrict,
      'villageCity': villageCity,
      'pinCode': pinCode,
      'phoneNumber': phoneNumber,
    };
  }
}
