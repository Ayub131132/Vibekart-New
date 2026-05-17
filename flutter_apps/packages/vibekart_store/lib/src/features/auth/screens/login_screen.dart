import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibekart_core/vibekart_core.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  final bool isSignup;
  const LoginScreen({super.key, this.isSignup = false});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email')),
      );
      return;
    }

    try {
      await ref.read(authControllerProvider.notifier).sendOtp(
        email, 
        widget.isSignup ? 'signup' : 'login',
      );
      setState(() => _otpSent = true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('OTP sent to your email')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit OTP')),
      );
      return;
    }

    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(
        _emailController.text.trim(), 
        otp,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          color: VibeTheme.bgBlack,
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 60),
                Text(
                  widget.isSignup ? 'CREATE ACCOUNT' : 'WELCOME BACK',
                  style: VibeTheme.darkTheme.textTheme.displayLarge?.copyWith(fontSize: 24),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.isSignup ? 'Join the future of shopping.' : 'Securely access your vibes.',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 48),
                
                if (!_otpSent) ...[
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: 'Email Address',
                      prefixIcon: Icon(LucideIcons.mail, size: 20),
                    ),
                    style: const TextStyle(color: Colors.white),
                  ),
                  const SizedBox(height: 24),
                  VibeButton(
                    text: 'SEND OTP',
                    loading: authState.isLoading,
                    onPressed: _handleSendOtp,
                  ),
                ] else ...[
                  Text(
                    'OTP sent to ${_emailController.text}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: VibeTheme.accentBlue, fontSize: 13),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    textAlign: TextAlign.center,
                    decoration: const InputDecoration(
                      hintText: '000000',
                      counterText: '',
                    ),
                    style: const TextStyle(
                      color: Colors.white, 
                      fontSize: 24, 
                      letterSpacing: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),
                  VibeButton(
                    text: 'VERIFY & CONTINUE',
                    loading: authState.isLoading,
                    onPressed: _handleVerifyOtp,
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => setState(() => _otpSent = false),
                    child: const Text('Change Email', style: TextStyle(color: Colors.white54)),
                  ),
                ],

                const Spacer(),
                
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      widget.isSignup ? 'Already have an account? ' : 'Don\'t have an account? ',
                      style: const TextStyle(color: Colors.white54),
                    ),
                    GestureDetector(
                      onTap: () {
                        // In a real app with routing, use context.push
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (_) => LoginScreen(isSignup: !widget.isSignup),
                          ),
                        );
                      },
                      child: Text(
                        widget.isSignup ? 'Login' : 'Sign Up',
                        style: const TextStyle(
                          color: VibeTheme.accentBlue,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
