"""
Create realistic poor quality invoice images to test OCR robustness
Simulates real-world conditions: blur, noise, low light, skew, compression
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import cv2
import numpy as np
import os
import random

def create_poor_quality_invoices():
    """Create various poor quality invoice images for testing"""
    
    # Start with our high quality invoice
    base_image_path = "sample_invoice_sarah_johnson_hq.png"
    if not os.path.exists(base_image_path):
        print("❌ Base image not found! Run create_invoice_image.py first")
        return
    
    base_image = Image.open(base_image_path)
    print(f"✅ Loaded base image: {base_image.size}")
    
    test_images = []
    
    # 1. BLURRY IMAGE (motion blur)
    print("🔄 Creating blurry image...")
    blurry = base_image.filter(ImageFilter.GaussianBlur(radius=2.5))
    blurry_path = "sample_invoices/test_blurry_invoice.png"
    blurry.save(blurry_path)
    test_images.append(("Blurry (Motion)", blurry_path))
    
    # 2. LOW LIGHT / DARK IMAGE
    print("🔄 Creating low light image...")
    dark_enhancer = ImageEnhance.Brightness(base_image)
    dark = dark_enhancer.enhance(0.4)  # 40% brightness
    dark_path = "sample_invoices/test_dark_invoice.png"
    dark.save(dark_path)
    test_images.append(("Low Light", dark_path))
    
    # 3. OVEREXPOSED / BRIGHT IMAGE
    print("🔄 Creating overexposed image...")
    bright_enhancer = ImageEnhance.Brightness(base_image)
    bright = bright_enhancer.enhance(1.8)  # 180% brightness
    bright_path = "sample_invoices/test_bright_invoice.png"
    bright.save(bright_path)
    test_images.append(("Overexposed", bright_path))
    
    # 4. LOW CONTRAST IMAGE
    print("🔄 Creating low contrast image...")
    contrast_enhancer = ImageEnhance.Contrast(base_image)
    low_contrast = contrast_enhancer.enhance(0.5)  # 50% contrast
    low_contrast_path = "sample_invoices/test_low_contrast_invoice.png"
    low_contrast.save(low_contrast_path)
    test_images.append(("Low Contrast", low_contrast_path))
    
    # 5. NOISY IMAGE
    print("🔄 Creating noisy image...")
    cv_image = cv2.cvtColor(np.array(base_image), cv2.COLOR_RGB2BGR)
    noise = np.random.normal(0, 25, cv_image.shape).astype(np.uint8)
    noisy_cv = cv2.add(cv_image, noise)
    noisy_image = Image.fromarray(cv2.cvtColor(noisy_cv, cv2.COLOR_BGR2RGB))
    noisy_path = "sample_invoices/test_noisy_invoice.png"
    noisy_image.save(noisy_path)
    test_images.append(("Noisy", noisy_path))
    
    # 6. ROTATED/SKEWED IMAGE
    print("🔄 Creating skewed image...")
    skewed = base_image.rotate(-3, expand=True, fillcolor='white')  # 3 degrees counter-clockwise
    skewed_path = "sample_invoices/test_skewed_invoice.png"
    skewed.save(skewed_path)
    test_images.append(("Skewed", skewed_path))
    
    # 7. LOW RESOLUTION / PIXELATED
    print("🔄 Creating low resolution image...")
    small = base_image.resize((400, 533), Image.LANCZOS)  # Much smaller
    pixelated = small.resize(base_image.size, Image.NEAREST)  # Scale back up with pixelation
    pixelated_path = "sample_invoices/test_pixelated_invoice.png"
    pixelated.save(pixelated_path)
    test_images.append(("Low Resolution", pixelated_path))
    
    # 8. COMPRESSED/ARTIFACTED IMAGE
    print("🔄 Creating compressed image...")
    # Save as JPEG with low quality, then convert back to PNG
    temp_jpg = "temp_compressed.jpg"
    base_image.save(temp_jpg, "JPEG", quality=15)  # Very low quality
    compressed = Image.open(temp_jpg)
    compressed_path = "sample_invoices/test_compressed_invoice.png"
    compressed.save(compressed_path)
    os.remove(temp_jpg)
    test_images.append(("Compressed", compressed_path))
    
    # 9. COMBINATION: Multiple issues
    print("🔄 Creating worst case scenario image...")
    worst = base_image.copy()
    # Apply multiple degradations
    worst = worst.filter(ImageFilter.GaussianBlur(radius=1.5))  # Slight blur
    worst_enhancer_brightness = ImageEnhance.Brightness(worst)
    worst = worst_enhancer_brightness.enhance(0.6)  # Darker
    worst_enhancer_contrast = ImageEnhance.Contrast(worst)
    worst = worst_enhancer_contrast.enhance(0.7)  # Lower contrast
    worst = worst.rotate(-2, expand=True, fillcolor='white')  # Slight skew
    
    # Add noise
    cv_worst = cv2.cvtColor(np.array(worst), cv2.COLOR_RGB2BGR)
    noise = np.random.normal(0, 15, cv_worst.shape).astype(np.uint8)
    noisy_worst = cv2.add(cv_worst, noise)
    worst_final = Image.fromarray(cv2.cvtColor(noisy_worst, cv2.COLOR_BGR2RGB))
    
    worst_path = "sample_invoices/test_worst_case_invoice.png"
    worst_final.save(worst_path)
    test_images.append(("Worst Case", worst_path))
    
    print(f"✅ Created {len(test_images)} test images for OCR testing:")
    for name, path in test_images:
        print(f"   📄 {name}: {path}")
    
    print("\n🧪 Test these images with your OCR system to verify robustness!")
    print("💡 The enhanced OCR should handle these challenging conditions better.")
    
    return test_images

if __name__ == "__main__":
    # Create the sample_invoices directory if it doesn't exist
    os.makedirs("sample_invoices", exist_ok=True)
    create_poor_quality_invoices()
