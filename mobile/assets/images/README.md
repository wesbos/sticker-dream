# Images and Icons

This directory contains app icons, splash screens, and UI graphics for the Sticker Dream application across iOS and Android platforms.

## Directory Structure

```
images/
├── README.md (this file)
├── app-icon.png                 # Master icon (ideally 1024x1024)
├── splash-screen.png            # Master splash (portrait orientation)
├── ios/                          # iOS-specific assets
│   ├── icon-20.png             # iOS notification icon
│   ├── icon-29.png             # iOS settings icon
│   ├── icon-40.png             # iOS spotlight search
│   ├── icon-60.png             # iOS app icon (home screen)
│   ├── icon-76.png             # iPad icon
│   ├── icon-83.5.png           # iPad Pro icon
│   ├── icon-120.png            # iPhone app icon (retina)
│   ├── icon-152.png            # iPad retina
│   ├── icon-180.png            # iPhone 6s Plus
│   ├── icon-1024.png           # App Store icon
│   └── splash-screen.png       # Launch screen image
├── android/                      # Android-specific assets
│   ├── mipmap-ldpi/
│   │   └── ic_launcher.png     # Low DPI (120 DPI, 36x36)
│   ├── mipmap-mdpi/
│   │   └── ic_launcher.png     # Medium DPI (160 DPI, 48x48)
│   ├── mipmap-hdpi/
│   │   └── ic_launcher.png     # High DPI (240 DPI, 72x72)
│   ├── mipmap-xhdpi/
│   │   └── ic_launcher.png     # Extra High DPI (320 DPI, 96x96)
│   ├── mipmap-xxhdpi/
│   │   └── ic_launcher.png     # Extra Extra High DPI (480 DPI, 144x144)
│   └── splash-screen.png       # Splash/launch screen
└── ui/                           # Custom UI graphics (optional)
    ├── logo.png
    └── ...
```

## App Icons

### Master Icon Guidelines
- **Source File**: Create a single large icon (1024x1024 pixels minimum)
- **Format**: PNG with transparency (RGBA)
- **Color Space**: sRGB
- **Padding**: Include safe area (icon content in center 80% of canvas)
- **Style**: Flat, modern, distinctive at small sizes

### iOS App Icons

iOS requires icons in various sizes for different device types and contexts.

#### Icon Sizes Required
| Size | Points | Pixels (3x) | Usage |
|------|--------|------------|-------|
| 20pt | 20 | 60 | Notification icon (3x) |
| 20pt | 20 | 40 | Notification icon (2x) |
| 29pt | 29 | 87 | Settings icon (3x) |
| 29pt | 29 | 58 | Settings icon (2x) |
| 40pt | 40 | 120 | Spotlight search (3x) |
| 40pt | 40 | 80 | Spotlight search (2x) |
| 60pt | 60 | 180 | App icon, iPhone 6s Plus (3x) |
| 60pt | 60 | 120 | App icon, iPhone (2x) |
| 76pt | 76 | 152 | App icon, iPad (2x) |
| 83.5pt | 83.5 | 167 | App icon, iPad Pro (2x) |
| 1024pt | 1024 | 1024 | App Store |

#### iOS Icon Creation
```
Starting from 1024x1024 master icon:
1. Scale down to each required size
2. Add slight corner radius (iOS 7+ style - usually 180-220 degree radius)
3. Export as PNG with transparency (RGBA)
4. Add 2x and 3x versions for retina displays
```

#### Exposure: SafeArea
- Ensure critical icon content stays within 80% of the icon bounds
- iOS automatically applies corner radius and can apply masks
- Test icons in Settings app and Spotlight to verify appearance

### Android App Icons

Android uses a density-based approach with multiple DPI buckets.

#### Icon Sizes and DPI
| Folder | DPI | Size (px) | Scale Factor |
|--------|-----|----------|--------------|
| mipmap-ldpi | 120 | 36x36 | 0.75x |
| mipmap-mdpi | 160 | 48x48 | 1.0x (baseline) |
| mipmap-hdpi | 240 | 72x72 | 1.5x |
| mipmap-xhdpi | 320 | 96x96 | 2.0x |
| mipmap-xxhdpi | 480 | 144x144 | 3.0x |
| mipmap-xxxhdpi | 640 | 192x192 | 4.0x |

#### Android Icon Creation
```
Starting from 192x192 or larger master icon:
1. Create master at 192x192 (xxxhdpi baseline)
2. Scale down to other densities:
   - 192px → xxxhdpi
   - 144px → xxhdpi
   - 96px → xhdpi
   - 72px → hdpi
   - 48px → mdpi
   - 36px → ldpi
3. Add corner radius if desired (Material Design: 8dp)
4. Export as PNG (RGBA for transparency)
5. Place in appropriate mipmap-{dpi} folder
```

#### Android Icon Requirements
- **Format**: PNG with 8-bit transparency (RGBA)
- **Colors**: Use 24-bit color (8 bits per channel)
- **Corners**: Can be sharp or slightly rounded (be consistent)
- **Transparency**: Anti-alias edges properly
- **Size**: Exactly as specified above for each density

### Adaptive Icons (Android 8.0+)
Modern Android apps use Adaptive Icons with foreground and background layers.

#### Adaptive Icon Sizes
| Folder | DPI | Foreground | Background |
|--------|-----|-----------|------------|
| drawable-mdpi | 160 | 81x81 | 108x108 |
| drawable-hdpi | 240 | 108x108 | 162x162 |
| drawable-xhdpi | 320 | 162x162 | 216x216 |
| drawable-xxhdpi | 480 | 216x216 | 324x324 |
| drawable-xxxhdpi | 640 | 324x324 | 432x432 |

#### Creating Adaptive Icons
```xml
<!-- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml -->
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@drawable/ic_launcher_background"/>
  <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

## Splash Screens

### Design Guidelines
- **Aspect Ratio**: Portrait (9:16 or close)
- **Safe Area**: Keep important content in center 80% (avoid screen edges)
- **Text**: Minimal or none (can be added by native code)
- **Branding**: App logo/name prominently displayed
- **Background**: Solid color or subtle gradient recommended

### iOS Splash Screen
- **Size**: Variable (uses safe area layout)
- **Modern Approach**: Use LaunchScreen.storyboard (XML/UI builder)
- **Legacy**: Static images (for testing, deprecated)
- **Format**: PNG with safe area considerations

#### iOS Launch Screen Requirements
```
iPad:     2048x2732
iPhone 12 Pro Max: 1284x2778
iPhone 12:        1170x2532
iPhone SE:        640x1136
```

**Best Practice**: Use LaunchScreen.storyboard with:
- Logo image (centered)
- App name/text
- Background color
- Optional animation

### Android Splash Screen
- **Size**: Match device screen ratio (ideally 1080x1920 for hdpi)
- **Format**: PNG for transparency support
- **Scalable**: Provide multiple densities

#### Android Splash Screen Sizes
| Folder | DPI | Size (px) | Aspect Ratio |
|--------|-----|----------|------------|
| drawable-ldpi | 120 | 320x426 | 3:4 |
| drawable-mdpi | 160 | 320x470 | ~3:4.4 |
| drawable-hdpi | 240 | 480x640 | 3:4 |
| drawable-xhdpi | 320 | 720x1280 | 9:16 |
| drawable-xxhdpi | 480 | 1080x1920 | 9:16 |
| drawable-xxxhdpi | 640 | 1440x2560 | 9:16 |

### Modern Splash Screen Approach (Expo)
Using `expo-splash-screen`:
```typescript
// app.json
{
  "splash": {
    "image": "./assets/images/splash-screen.png",
    "resizeMode": "contain",
    "backgroundColor": "#FFFFFF"
  }
}
```

## Image Formats and Specifications

### PNG (Recommended for Icons)
- **Use Case**: Icons, graphics with transparency, logos
- **Compression**: Lossless
- **Transparency**: Full support (alpha channel)
- **File Size**: Larger than JPG
- **Quality**: No quality loss
- **Color Depth**: 8-bit, 24-bit, 32-bit (with alpha)

#### PNG Optimization
```bash
# Using ImageMagick
convert input.png -strip output.png

# Using pngcrush
pngcrush -brute input.png output.png

# Using optipng
optipng -o7 input.png
```

### JPG (Good for Photos/Gradients)
- **Use Case**: Photographs, gradients, complex imagery
- **Compression**: Lossy
- **Transparency**: Not supported
- **File Size**: Smaller than PNG
- **Quality**: Some loss (configurable)
- **Best For**: Full-screen images without transparency

#### JPG Optimization
```bash
# Using ImageMagick
convert input.jpg -quality 80 -strip output.jpg

# Using mozjpeg (better quality)
cjpeg -quality 80 input.ppm -outfile output.jpg
```

### WebP (Modern Format)
- **Use Case**: Next-generation format (Android 4.0+, iOS 14+)
- **Compression**: Better than PNG, supports transparency
- **File Size**: 25-35% smaller than PNG
- **Adoption**: Growing support, good for modern devices

#### WebP Conversion
```bash
# Using cwebp
cwebp input.png -o output.webp

# Using ImageMagick
convert input.png output.webp
```

## Image Optimization Tools

### Online Tools
- **TinyPNG** (https://tinypng.com/) - Compress PNG/JPG
- **CloudConvert** (https://cloudconvert.com/) - Convert between formats
- **ImageOptim Online** (https://imageoptim.com/online) - Batch optimization

### Command Line
- **ImageMagick** (https://imagemagick.org/) - Comprehensive image manipulation
- **OptiPNG** (http://optipng.sourceforge.net/) - PNG optimization
- **PNGQuant** (https://pngquant.org/) - Reduce PNG colors
- **MozJPEG** (https://github.com/mozilla/mozjpeg) - JPEG optimization

### Desktop Apps
- **ImageOptim** (Mac) - Drag-and-drop image optimization
- **XnConvert** (Cross-platform) - Batch image conversion
- **Affinity Photo** (Mac/Windows) - Professional image editing

## Automated Icon Generation

### Using EasyAppIcon
Website: https://easyappicon.com/
1. Upload 1024x1024 PNG
2. Download iOS and Android icons
3. Automated resizing to all required sizes

### Using Figma
1. Design master icon at 1024x1024
2. Export multiple sizes
3. Plugins available for batch export

### Using React Native Assets
Command-line tools (if using React Native CLI):
```bash
# Generate icons from master image
# (Tool availability depends on your setup)
```

## Implementation in React Native/Expo

### Using app.json (Expo)
```json
{
  "expo": {
    "name": "Sticker Dream",
    "icon": "./assets/images/app-icon.png",
    "splash": {
      "image": "./assets/images/splash-screen.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "ios": {
      "icon": "./assets/images/ios/icon-1024.png"
    },
    "android": {
      "icon": "./assets/images/android/mipmap-mdpi/ic_launcher.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android/ic_launcher_foreground.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

### Using Native Configuration
**iOS (Info.plist)**:
```xml
<key>CFBundleIcons</key>
<dict>
  <key>CFBundlePrimaryIcon</key>
  <dict>
    <key>CFBundleIconFiles</key>
    <array>
      <string>icon-180</string>
      <string>icon-120</string>
      <string>icon-60</string>
    </array>
  </dict>
</dict>
```

**Android (AndroidManifest.xml)**:
```xml
<application
  android:icon="@mipmap/ic_launcher"
  android:roundIcon="@mipmap/ic_launcher_round">
</application>
```

## Design Best Practices

### Icon Design
1. **Simplicity**: Works at small sizes (29x29 pixels)
2. **Distinctiveness**: Recognizable at a glance
3. **Consistency**: Aligns with app's visual identity
4. **Safe Area**: Keep important content in center 60-70%
5. **No Text**: Avoid small text that won't render clearly
6. **Colors**: Use contrasting colors for visibility
7. **Style**: Consistency with platform (iOS vs Android aesthetic)

### Splash Screen Design
1. **Branding**: Display logo prominently
2. **Loading**: Visual indication that app is launching
3. **Color**: Use brand colors
4. **Minimal Text**: Keep typography simple
5. **Safe Area**: Avoid placement near edges
6. **Performance**: Keep as simple image (no animations)
7. **Duration**: Brief (1-2 seconds max before app ready)

## Testing and Validation

### iOS Testing
```bash
# Build and run on simulator
xcrun simctl install booted <path-to-app>

# Test on device
xcodebuild -scheme <scheme> -destination generic/platform=iOS
```

### Android Testing
```bash
# Build APK
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Verification Checklist
- [ ] Icon appears correctly in app launcher
- [ ] Icon appears in Settings app
- [ ] Splash screen displays during startup
- [ ] No blurriness or pixelation at small sizes
- [ ] Colors render correctly on device
- [ ] Safe area respected (no content cut off)
- [ ] Adaptive icons render properly (Android 8.0+)
- [ ] Transparent areas display correctly

## Common Issues and Solutions

### Icon Too Blurry
- Verify correct size for target device
- Check that anti-aliasing is applied
- Ensure scaling is done correctly (use "contain" not "cover")
- Re-export from design tool at correct size

### Splash Screen Stretched
- Use `resizeMode: "contain"` in Expo config
- Provide multiple sizes for different densities
- Test on multiple device sizes
- Use SVG or vector format for scalability

### Colors Look Different on Device
- Test in design tool with device color profile
- Avoid relying on small color differences
- Use web-safe colors
- Test on actual devices (not just simulator)

### Missing Icons
- Verify file paths are correct (case-sensitive)
- Check file exists and is readable
- Ensure icon is in build bundle
- Clear cache and rebuild app

## Licensing and Attribution

### When Using Icon/Image Libraries

#### Free Icon Resources
- **Material Design Icons** (https://fonts.google.com/icons)
  - License: Apache 2.0
  - 2000+ icons, free commercial use

- **Font Awesome** (https://fontawesome.com/)
  - License: Free version is CC BY 4.0
  - 6000+ icons, free and pro versions

- **Feather Icons** (https://feathericons.com/)
  - License: MIT
  - 286 minimal icons, free

- **Unicons** (https://www.iconfu.com/icons)
  - License: SIL OFL 1.1
  - 3000+ icons, free

#### Commercial Icon Libraries
- **Noun Project** (https://thenounproject.com/)
  - Subscriptions or pay-per-icon
  - High-quality, professional icons

- **Iconfinder** (https://www.iconfinder.com/)
  - Free and commercial icons
  - Many free options with proper attribution

### Attribution Format
```
Icons:
- "App icon" by [Creator/Library] ([License])
- Material Design Icons by Google (Apache 2.0)
- Feather Icons by Cole Bemis (MIT)
```

## Additional Resources

- [Apple Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Google Material Design](https://material.io/design/iconography/system-icons.html)
- [Android Icon Guidelines](https://developer.android.com/guide/topics/ui/look-and-feel/icon-design-specifications)
- [Figma Icon Design Guide](https://help.figma.com/hc/en-us/articles/360040449913)
- [Expo Image Documentation](https://docs.expo.dev/guides/assets/#bundling-media-in-your-app)
