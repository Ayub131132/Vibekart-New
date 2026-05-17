import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../providers/cart_provider.dart';
import '../../auth/providers/auth_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _addressController = TextEditingController();
  String _paymentMethod = 'COD';
  String _couponCode = '';
  Coupon? _appliedCoupon;
  bool _isVerifyingCoupon = false;
  bool _isPlacingOrder = false;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(userProfileProvider).value;
    if (profile != null && profile.addressLine != null) {
      _addressController.text = '${profile.addressLine}, ${profile.villageCity}, ${profile.selectedDistrict}, ${profile.selectedState} - ${profile.pinCode}';
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    super.dispose();
  }

  double get _total {
    final subtotal = ref.read(cartProvider).subtotal;
    if (_appliedCoupon == null) return subtotal;

    if (_appliedCoupon!.type == CouponType.fixed) {
      return (subtotal - _appliedCoupon!.discount).clamp(0.0, double.infinity);
    } else {
      return subtotal * (1 - _appliedCoupon!.discount / 100);
    }
  }

  Future<void> _handleVerifyCoupon() async {
    if (_couponCode.isEmpty) return;

    setState(() => _isVerifyingCoupon = true);
    try {
      final coupon = await ref.read(apiServiceProvider).verifyCoupon(_couponCode);
      setState(() => _appliedCoupon = coupon);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Coupon "${coupon.code}" applied!'), backgroundColor: VibeTheme.successGreen),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: VibeTheme.errorRed),
        );
      }
    } finally {
      setState(() => _isVerifyingCoupon = false);
    }
  }

  Future<void> _handlePlaceOrder() async {
    final address = _addressController.text.trim();
    if (address.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid full delivery address')),
      );
      return;
    }

    setState(() => _isPlacingOrder = true);
    
    try {
      final total = _total;
      final finalPaymentMethod = total <= 0 ? 'FREE_COUPON' : _paymentMethod;

      if (finalPaymentMethod == 'Razorpay') {
        // Implement Razorpay Logic
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Razorpay integration coming soon!')),
        );
        return;
      }

      final result = await ref.read(apiServiceProvider).placeOrder(
        items: ref.read(cartProvider).items,
        address: address,
        paymentMethod: finalPaymentMethod,
        couponCode: _appliedCoupon?.code,
      );

      if (mounted) {
        context.go('/order-success/${result['orderId']}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: VibeTheme.errorRed),
        );
      }
    } finally {
      setState(() => _isPlacingOrder = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartState = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('CHECKOUT')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionTitle(title: 'DELIVERY ADDRESS', icon: LucideIcons.mapPin),
            const SizedBox(height: 16),
            TextField(
              controller: _addressController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'House No, Street, Landmark, City, State, ZIP',
              ),
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
            const SizedBox(height: 32),
            
            const _SectionTitle(title: 'PROMO CODE', icon: LucideIcons.ticket),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (v) => _couponCode = v.toUpperCase(),
                    decoration: const InputDecoration(hintText: 'ENTER CODE'),
                    textCapitalization: TextCapitalization.characters,
                    enabled: _appliedCoupon == null,
                  ),
                ),
                const SizedBox(width: 12),
                if (_appliedCoupon == null)
                  VibeButton(
                    text: 'APPLY',
                    onPressed: _handleVerifyCoupon,
                    loading: _isVerifyingCoupon,
                    fullWidth: false,
                  )
                else
                  IconButton(
                    icon: const Icon(LucideIcons.xCircle, color: VibeTheme.errorRed),
                    onPressed: () => setState(() {
                      _appliedCoupon = null;
                      _couponCode = '';
                    }),
                  ),
              ],
            ),
            const SizedBox(height: 32),

            const _SectionTitle(title: 'PAYMENT METHOD', icon: LucideIcons.creditCard),
            const SizedBox(height: 16),
            _PaymentOption(
              title: 'Cash on Delivery',
              subtitle: 'Pay when you receive',
              icon: LucideIcons.truck,
              isSelected: _paymentMethod == 'COD',
              onTap: () => setState(() => _paymentMethod = 'COD'),
            ),
            const SizedBox(height: 12),
            _PaymentOption(
              title: 'Online Payment',
              subtitle: 'Razorpay / UPI / Cards',
              icon: LucideIcons.zap,
              isSelected: _paymentMethod == 'Razorpay',
              onTap: () => setState(() => _paymentMethod = 'Razorpay'),
            ),
            const SizedBox(height: 40),

            VibeCard(
              child: Column(
                children: [
                  _SummaryRow(label: 'Subtotal', value: '₹${cartState.subtotal.toStringAsFixed(2)}'),
                  if (_appliedCoupon != null) ...[
                    const SizedBox(height: 12),
                    _SummaryRow(
                      label: 'Discount (${_appliedCoupon!.code})', 
                      value: '-₹${(cartState.subtotal - _total).toStringAsFixed(2)}',
                      color: VibeTheme.successGreen,
                    ),
                  ],
                  const SizedBox(height: 12),
                  const _SummaryRow(label: 'Shipping', value: 'FREE', color: VibeTheme.accentBlue),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Divider(color: Colors.white10),
                  ),
                  _SummaryRow(
                    label: 'TOTAL', 
                    value: '₹${_total.toStringAsFixed(2)}', 
                    isBold: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            VibeButton(
              text: 'PLACE ORDER',
              onPressed: _handlePlaceOrder,
              loading: _isPlacingOrder,
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionTitle({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: VibeTheme.accentBlue),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}

class _PaymentOption extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _PaymentOption({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? VibeTheme.accentBlue.withOpacity(0.05) : Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? VibeTheme.accentBlue : Colors.white.withOpacity(0.05),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? VibeTheme.accentBlue : Colors.white24),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.white54)),
                ],
              ),
            ),
            if (isSelected)
              const Icon(LucideIcons.checkCircle2, color: VibeTheme.accentBlue, size: 20),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;
  final bool isBold;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.color,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: color ?? Colors.white70, fontWeight: isBold ? FontWeight.bold : null)),
        Text(
          value,
          style: TextStyle(
            color: color ?? (isBold ? VibeTheme.accentBlue : Colors.white),
            fontWeight: isBold ? FontWeight.w900 : FontWeight.bold,
            fontSize: isBold ? 18 : 14,
          ),
        ),
      ],
    );
  }
}
