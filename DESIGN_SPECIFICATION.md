# DESIGNERBLOCKS: Project Specification (v1.0)
## Core Philosophy: The "KEYZ" Foundation

Designerblocks is a premium, native-first framework for building secure, high-fidelity iOS applications. This specification represents the "First Iteration" of the codebase, distilled from the KEYZ project. 

This document is optimized for **Claude Opus 4.6** to serve as a high-fidelity "source of truth" for code generation, architectural decisions, and design consistency.

---

## 🎨 Design System & Aesthetics

The application follows a **Premium Glassmorphic** aesthetic, characterized by deep depth, vibrant accents, and smooth physics-based animations.

### Color Palette (Gradients)
- **Auth Background**: 
  - Base: `LinearGradient` from `#12121F` (top-leading) to `#101429` (bottom-trailing).
  - Glow: `RadialGradient` (top center) with `AccentColor` at 8% opacity.
- **Action Buttons**: 
  - Enabled: `LinearGradient` from `#0073FF` to `#008CFF`.
  - Shadow: Blue glow, `radius: 12`, `y: 6`, `opacity: 0.3`.

### Visual Components
- **GlassCard**: 
  - Material: `.ultraThinMaterial`.
  - Border: `0.5pt` stroke, white at 25% opacity.
  - Shadow: Black at 8% opacity, `radius: 16`, `y: 8`.
- **SolidCard**: 
  - Material: `.secondarySystemGroupedBackground`.
  - Shadow: Black at 4% opacity, `radius: 10`, `y: 4`.

---

## 🏗️ Architecture: Service-Oriented Logic

The app uses a modern **SwiftUI Observation** pattern with singleton service managers.

### 1. SupabaseManager (`@Observable`)
- **Role**: Handles all remote data persistence and authentication.
- **Auth Flow**: 
  - Email/Password + OTP Verification (6-digit code).
  - Password Reset with Recovery Tokens.
- **Data Patterns**:
  - Contacts CRUD using Supabase's `PostgREST` client.
  - Profile Management with Avatar storage in S3-compatible buckets.
- **State**: Reactive `currentSession`, `isAuthenticated`, and `currentUser` properties.

### 2. SecurityManager (`@Observable`)
- **Role**: Local device security and biometric state.
- **Logic**: 
  - Uses `LAContext` for Face ID / Touch ID evaluation.
  - `isLocked` flag triggers a global `BiometricLockView`.
  - Automatic locking on `scenePhase` transition to background.

---

## 📱 Module Breakdown

### Authentication Module
- **AuthView**: Unified Sign-In / Sign-Up with smooth crossfade transitions.
- **SecureToggleField**: Custom component with eye-icon visibility toggle.
- **OTPVerificationView**: 6-slot individual digit input with auto-focus and resend timers.
- **PasswordStrengthView**: Live feedback bar checking for length, case, numbers, and symbols.

### Contact Management Module
- **ContactsListView**: Searchable list with pull-to-refresh and FAB (Floating Action Button).
- **ContactDetailView**: Dual-mode (View/Edit) screen. 
- **Geolocation**: Integration with Apple Maps for address navigation.

### Global Assets & Onboarding
- **OnboardingSlider**: 2-screen paging `TabView` with `AppStorage` persistence for first-launch tracking.
- **Theme.swift**: Centralized repository for all `ViewModifiers`, `ButtonStyles`, and color tokens.

---

## 🛠️ Implementation Directives for Claude Opus 4.6

When generating code based on this specification, follow these rules:

1. **Native Priority**: Use pure SwiftUI 5.0+ (iOS 17+) conventions. Avoid UIKit wrappers unless strictly necessary.
2. **Animation Physics**: Use `.spring(response: 0.45, dampingFraction: 0.75)` for layout transitions and `.spring(response: 0.25, dampingFraction: 0.7)` for button presses.
3. **Reactive State**: Prefer the `@Observable` macro over `ObservableObject`.
4. **Security First**: Ensure all sensitive views are wrapped in `if !securityManager.isLocked`.
5. **Aesthetics**: Every card should be a `GlassCard`, and every input should use the `GlassFieldStyle`.

---

*End of Specification*
