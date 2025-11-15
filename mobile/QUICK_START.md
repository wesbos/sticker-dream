# Quick Start Guide - Sticker Dream UI Components

## Import Components

```tsx
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  ImagePreview,
  TranscriptDisplay,
  PrinterStatus,
  type PrinterInfo,
} from '@/components';
```

## Component Examples

### Button
```tsx
<Button
  title="Generate Sticker"
  onPress={() => generateSticker()}
  variant="primary"
/>
```

### Loading Spinner
```tsx
<LoadingSpinner
  size="medium"
  label="Generating your sticker..."
/>
```

### Error Message
```tsx
<ErrorMessage
  title="Connection Failed"
  message="Unable to connect to printer"
  severity="error"
  onRetry={() => retryConnection()}
/>
```

### Image Preview
```tsx
<ImagePreview
  imageUri={imageUri}
  onShare={() => shareImage()}
  onPrintAgain={() => printAgain()}
/>
```

### Transcript Display
```tsx
<TranscriptDisplay
  transcript="Create a pink cat sticker"
  isAnimating={true}
  duration={2000}
  language="en"
  confidence={0.95}
/>
```

### Printer Status
```tsx
<PrinterStatus
  printerInfo={{
    name: "Epson TM-m30II-H",
    isConnected: true,
    batteryLevel: 85,
    status: "ready",
    signal: 92,
  }}
  onRetry={() => reconnect()}
/>
```

## File Locations

All components are in: `/home/user/sticker-dream-RN-/mobile/components/`

- `Button.tsx` - Base button component
- `LoadingSpinner.tsx` - Loading animation
- `ErrorMessage.tsx` - Error/warning/info display
- `ImagePreview.tsx` - Image viewer with zoom
- `TranscriptDisplay.tsx` - Text display with typing animation
- `PrinterStatus.tsx` - Printer status indicator
- `index.ts` - Central exports
- `COMPONENTS.md` - Full documentation
- `USAGE_EXAMPLE.tsx` - Example implementations

## Color Palette

```
Primary Pink:  #FFE5F1
Sky Blue:      #B8E6FF
Light Blue:    #D4E5FF
Lavender:      #FFD4F1
Cream:         #FFFACD
```

## Key Features

✓ Full TypeScript support
✓ Smooth animations
✓ iOS/Android optimized
✓ Accessibility features
✓ No external UI libraries
✓ Production-ready
✓ Memory efficient
✓ Customizable colors and sizes

## Example Screen Implementation

See `USAGE_EXAMPLE.tsx` for complete screen implementations including:
- Full sticker generation flow
- Loading states
- Error handling
- Image preview
- Printer integration

---

All components are production-ready with no TODOs or incomplete code.
