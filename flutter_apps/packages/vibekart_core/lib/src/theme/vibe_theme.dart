import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class VibeTheme {
  // Colors
  static const Color bgBlack = Color(0xFF050505);
  static const Color bgDarkGray = Color(0xFF121212);
  static const Color accentBlue = Color(0xFF00d2ff);
  static const Color accentPurple = Color(0xFF9d50bb);
  static const Color errorRed = Color(0xFFff4b2b);
  static const Color successGreen = Color(0xFF00ff66);

  static const LinearGradient accentNeon = LinearGradient(
    colors: [accentBlue, accentPurple],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: accentBlue,
      scaffoldBackgroundColor: bgBlack,
      cardColor: bgDarkGray,
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.orbitron(
          fontSize: 32,
          fontWeight: FontWeight.black,
          color: Colors.white,
          letterSpacing: 2,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        fillColor: Colors.white.withOpacity(0.05),
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentBlue),
        ),
      ),
    );
  }
}
