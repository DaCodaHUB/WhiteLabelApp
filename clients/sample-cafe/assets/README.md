# sample-cafe assets

These are original, development-only placeholder images for the fictional Sample Cafe. Run `node clients/sample-cafe/assets/create-placeholders.js` to regenerate the PNG source files. Replace all artwork before onboarding a real business.

Put these PNG source files in this directory. Run `npm run client:prepare -- --client sample-cafe --environment development` to generate Android, iOS, and runtime artwork; do not edit generated resources.

- `app-icon.png`: exactly 1024 x 1024 pixels, fully opaque, no rounded corners.
- `splash-logo.png`: at least 1200 x 1200 pixels with transparency.
- `brand-logo.png`: at least 512 pixels wide with transparency.

Production requires all three valid images. Development uses a generic generated placeholder only when all three files are absent; a partial set is an error. Preparation resizes and converts the outputs to sRGB.
