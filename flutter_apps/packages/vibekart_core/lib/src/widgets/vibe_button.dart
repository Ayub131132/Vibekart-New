import 'package:flutter/material.dart';
import '../theme/vibe_theme.dart';

class VibeButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final bool fullWidth;
  final bool isSecondary;

  const VibeButton({
    super.key,
    required this.text,
    this.onPressed,
    this.loading = false,
    this.icon,
    this.fullWidth = true,
    this.isSecondary = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: 54,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: isSecondary ? null : VibeTheme.accentNeon,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSecondary || onPressed == null
              ? null
              : [
                  BoxShadow(
                    color: VibeTheme.accentBlue.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: ElevatedButton(
          onPressed: loading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: isSecondary ? Colors.white.withOpacity(0.05) : Colors.transparent,
            side: isSecondary ? BorderSide(color: Colors.white.withOpacity(0.1)) : null,
          ),
          child: loading
              ? const SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, size: 20),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      text,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
