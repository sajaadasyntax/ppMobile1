# Fix Image Issues for Prebuild

If prebuild works without images, the issue is with corrupted image files. Here's how to fix:

## Option 1: Use Online Icon Generator
1. Go to https://www.favicon-generator.org/ or https://realfavicongenerator.net/
2. Upload a valid image (JPG/PNG)
3. Download the generated icons
4. Replace the files in `assets/images/`

## Option 2: Create New Images Using ImageMagick (if installed)
```bash
# Convert and resize an existing image to create a valid icon
magick convert assets/images/icon.png -resize 1024x1024 assets/images/icon-new.png
```

## Option 3: Use Expo's Default Icon
Temporarily comment out the icon in app.json and let Expo use defaults, then add custom icons later.

## Option 4: Re-download/Re-create Images
The current image files might be corrupted. Re-create them from source or download fresh copies.

