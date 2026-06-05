import sys
from PIL import Image

def process_image():
    img_path = r'c:\Users\LapMart.LK\Desktop\inventory-system\frontend\src\assets\images\slpa-logo.png'
    img = Image.open(img_path).convert("RGBA")
    
    target_r, target_g, target_b = 11, 34, 57  # Hex #0b2239
    
    width, height = img.size
    pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Pure white or very close
            if r > 230 and g > 230 and b > 230:
                # Replace with the sidebar dark blue color
                pixels[x, y] = (target_r, target_g, target_b, a)
            elif (r + g + b) / 3 > 180:
                # Soft blend for anti-aliasing pixels
                factor = ((r + g + b) / 3 - 180) / (255 - 180)
                new_r = int(r * (1 - factor) + target_r * factor)
                new_g = int(g * (1 - factor) + target_g * factor)
                new_b = int(b * (1 - factor) + target_b * factor)
                pixels[x, y] = (new_r, new_g, new_b, a)
                
    img.save(img_path, "PNG")
    print("Image processed successfully.")

if __name__ == "__main__":
    process_image()
