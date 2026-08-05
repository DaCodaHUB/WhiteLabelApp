# Demo client assets

This directory is reserved for client-specific branding assets.

Required production source artwork (the demo may use placeholders):

- `app-icon.png`: 1024 x 1024 opaque sRGB PNG.
- `splash-logo.png`: at least 1200 x 1200 transparent PNG.
- `brand-logo.png`: at least 512 px wide transparent PNG.

Add runtime images through an explicit static `require()` registry. Never build dynamic asset paths.
