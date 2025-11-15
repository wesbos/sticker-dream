# Component Architecture & Design

## Component Hierarchy

```
@/components
├── Button.tsx
│   └── Foundation component used by ErrorMessage and other components
│   └── Exports: Button, ButtonVariant type
│
├── LoadingSpinner.tsx
│   └── Standalone animation component
│   └── No dependencies on other components
│   └── Exports: LoadingSpinner
│
├── ErrorMessage.tsx
│   └── Uses: Button component
│   └── Exports: ErrorMessage
│
├── ImagePreview.tsx
│   └── Standalone complex component
│   └── No dependencies on other components
│   └── Exports: ImagePreview
│
├── TranscriptDisplay.tsx
│   └── Standalone display component
│   └── No dependencies on other components
│   └── Exports: TranscriptDisplay
│
├── PrinterStatus.tsx
│   └── Uses: No other components (self-contained)
│   └── Exports: PrinterStatus, PrinterInfo type
│
└── index.ts
    └── Central export hub for all components
```

## Component Dependencies

```
┌─────────────────────────────────────────────────┐
│            ErrorMessage Component               │
│  (depends on Button component for actions)      │
└──────────────────┬────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│             Button Component                     │
│   (foundation for all interactive buttons)       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          LoadingSpinner Component                │
│         (standalone, no dependencies)            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          ImagePreview Component                  │
│         (standalone, no dependencies)            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         TranscriptDisplay Component              │
│         (standalone, no dependencies)            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          PrinterStatus Component                 │
│         (standalone, no dependencies)            │
└─────────────────────────────────────────────────┘
```

## Component Data Flow

### Button Component
```
Props (title, variant, loading, disabled)
  ↓
State (isPressed)
  ↓
Animated Values (scaleAnim)
  ↓
Pressable → onPress callback
  ↓
Return styled Text component
```

### LoadingSpinner Component
```
Props (size, color, label)
  ↓
useEffect setup
  ↓
Multiple Animated Values (spinValue, rotationValue, opacityValue)
  ↓
Animated.loop() for continuous animation
  ↓
Return multiple Animated.View components
```

### ErrorMessage Component
```
Props (message, severity, onRetry, onDismiss)
  ↓
useEffect setup (slideAnim, opacityAnim)
  ↓
Conditional button rendering
  ↓
Button component (from Button.tsx)
  ↓
onRetry/onDismiss callbacks
```

### ImagePreview Component
```
Props (imageUri, onShare, onPrintAgain)
  ↓
State (zoom, imageDimensions, isLoading)
  ↓
PanResponder setup for gestures
  ↓
Animated Values (zoomAnim, panAnim)
  ↓
Image gesture handling
  ↓
Button callbacks
```

### TranscriptDisplay Component
```
Props (transcript, isAnimating, duration)
  ↓
State (displayedText, isComplete)
  ↓
useEffect for typing animation
  ↓
Character-by-character string building
  ↓
Cursor opacity animation
  ↓
Return formatted text with metadata
```

### PrinterStatus Component
```
Props (printerInfo, onRetry, onSettings)
  ↓
useEffect setup
  ↓
Multiple Animated Values (slideAnim, pulseAnim, batteryAnim)
  ↓
Conditional rendering based on status
  ↓
Button components for actions
  ↓
Status and battery indicators
```

## Type System Architecture

```
Core Component Types:
├── ButtonProps
│   ├── title: string
│   ├── onPress: () => void
│   ├── variant: ButtonVariant
│   ├── disabled: boolean
│   ├── loading: boolean
│   └── accessibilityLabel: string
│
├── PrinterInfo (exported)
│   ├── name: string
│   ├── model?: string
│   ├── isConnected: boolean
│   ├── batteryLevel?: number
│   ├── status?: 'ready' | 'printing' | 'error' | 'offline'
│   └── signal?: number
│
├── ButtonVariant (exported)
│   └── 'primary' | 'secondary' | 'danger'
│
├── LoadingSpinnerProps
│   ├── size: 'small' | 'medium' | 'large'
│   ├── color: string
│   └── label?: string
│
├── ErrorMessageProps
│   ├── message: string
│   ├── title?: string
│   ├── severity: 'error' | 'warning' | 'info'
│   ├── onRetry?: () => void
│   └── onDismiss?: () => void
│
├── ImagePreviewProps
│   ├── imageUri: string
│   ├── onShare?: () => void
│   ├── onPrintAgain?: () => void
│   └── onClose?: () => void
│
└── TranscriptDisplayProps
    ├── transcript: string
    ├── isAnimating?: boolean
    ├── duration?: number
    ├── language?: string
    ├── confidence?: number
    └── showTimestamp?: boolean
```

## Animation Architecture

### Timing Strategies

**Immediate Animations (0-300ms)**
- Button press feedback: 150ms scale
- Error slide-in: 400ms
- Loading spinner setup: instant

**Standard Animations (400-1000ms)**
- LoadingSpinner outer ring: 1000ms
- ErrorMessage fade: 400ms
- PrinterStatus slide: 400ms

**Loop Animations (500-2000ms)**
- LoadingSpinner inner ring: 2000ms
- Cursor blink: 500ms cycle
- Printer pulse (printing): 600ms cycle
- Battery warning flash: 500ms cycle

### Animation Techniques Used

1. **Spring Animation**
   - Used for: Button press, pan recovery, zoom feedback
   - Provides: Natural, bouncy feel
   - Code: `Animated.spring()`

2. **Timing Animation**
   - Used for: Slide-in effects, fade effects
   - Provides: Smooth, linear transitions
   - Code: `Animated.timing()`

3. **Loop Animation**
   - Used for: Continuous spinners, blinking cursors
   - Provides: Infinite, repeating motion
   - Code: `Animated.loop()`

4. **Sequence Animation**
   - Used for: Complex multi-step animations
   - Provides: Sequential animation chains
   - Code: `Animated.sequence()`

5. **Parallel Animation**
   - Used for: Simultaneous animations
   - Provides: Coordinated motion
   - Code: `Animated.parallel()`

## Color Scheme Architecture

```
Pastel Base Colors:
├── Primary Pink:   #FFE5F1 (light, warm)
├── Sky Blue:       #B8E6FF (light, cool)
├── Light Blue:     #D4E5FF (lighter, cool)
├── Lavender:       #FFD4F1 (light, warm)
└── Cream:          #FFFACD (lightest, warm)

Component Color Assignments:
├── Button
│   ├── Primary variant: Pink (#FFE5F1)
│   └── Secondary variant: Blue (#B8E6FF)
│
├── LoadingSpinner
│   ├── Primary ring: Pink (#FFE5F1)
│   ├── Secondary ring: Blue (#B8E6FF)
│   └── Center dot: Lavender (#FFD4F1)
│
├── ErrorMessage
│   ├── Error state: Lavender (#FFD4F1)
│   ├── Warning state: Cream (#FFFACD)
│   └── Info state: Light Blue (#D4E5FF)
│
├── ImagePreview
│   └── Background: Cream (#FFFACD)
│
├── TranscriptDisplay
│   └── Background: Cream (#FFFACD)
│
└── PrinterStatus
    └── Background: Blue (#B8E6FF)

Status Color Overrides (non-pastel for clarity):
├── Success: #4CAF50 (green)
├── Warning: #FFC107 (orange)
├── Error: #FF6B6B (red)
└── Info: #2196F3 (blue)
```

## Accessibility Architecture

### Semantic Structure

Every component includes:
1. **Accessibility Role**: semantic role (button, image, status, etc.)
2. **Accessibility Label**: describes what the element is
3. **Accessibility Hint**: describes what happens when pressed
4. **Accessibility State**: current state (disabled, busy, etc.)

### Implementation Pattern

```tsx
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Action description"
  accessibilityHint="What happens on press"
  accessibilityState={{
    disabled: isDisabled,
    busy: isLoading,
  }}
>
  {/* Content */}
</Pressable>
```

### Touch Target Requirements

All interactive elements meet minimum requirements:
- Minimum size: 44x44 points (Apple) / 48x48 dp (Android)
- Minimum spacing: 8 points between targets
- Clear, high-contrast colors
- Text size: minimum 16pt (12pt for secondary)

## Memory Management

### Cleanup Patterns

```tsx
// Animation cleanup on unmount
useEffect(() => {
  return () => {
    animValue.setValue(0);
    // Prevent memory leaks
  };
}, [animValue]);

// Interval cleanup
useEffect(() => {
  const interval = setInterval(() => {
    // Animation logic
  }, duration);

  return () => clearInterval(interval);
}, [duration]);
```

### Optimized Re-renders

- Components use React.FC with specific prop types
- useRef for non-state animation values
- useState only for necessary state changes
- useCallback for stable callback references
- Memoization of expensive calculations

## Testing Architecture

### Component Testing Points

1. **Button**
   - Variants render correctly
   - Press animations trigger
   - Disabled state prevents interaction
   - Loading state disables button

2. **LoadingSpinner**
   - All sizes render
   - Animations loop properly
   - Label displays correctly
   - Custom colors apply

3. **ErrorMessage**
   - All severity levels render
   - Buttons appear conditionally
   - Callbacks fire correctly
   - Animation triggers on mount

4. **ImagePreview**
   - Image loads correctly
   - Zoom works (1-3x range)
   - Pan updates position
   - Buttons trigger callbacks

5. **TranscriptDisplay**
   - Text displays completely
   - Animation types work
   - Metadata displays correctly
   - Scroll works for long text

6. **PrinterStatus**
   - Status indicators update
   - Battery level displays
   - Signal strength shows
   - Animations trigger correctly

---

All components follow a consistent architecture for maintainability and scalability.
