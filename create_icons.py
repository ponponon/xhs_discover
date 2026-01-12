from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    corner_radius = int(size * 0.1875)
    
    gradient_colors = [
        (255, 36, 66),
        (255, 107, 138)
    ]
    
    for y in range(size):
        for x in range(size):
            if x < corner_radius and y < corner_radius:
                if (x - corner_radius) ** 2 + (y - corner_radius) ** 2 > corner_radius ** 2:
                    continue
            elif x < corner_radius and y > size - corner_radius:
                if (x - corner_radius) ** 2 + (y - (size - corner_radius)) ** 2 > corner_radius ** 2:
                    continue
            elif x > size - corner_radius and y < corner_radius:
                if (x - (size - corner_radius)) ** 2 + (y - corner_radius) ** 2 > corner_radius ** 2:
                    continue
            elif x > size - corner_radius and y > size - corner_radius:
                if (x - (size - corner_radius)) ** 2 + (y - (size - corner_radius)) ** 2 > corner_radius ** 2:
                    continue
            
            ratio = (x + y) / (2 * size)
            r = int(gradient_colors[0][0] * (1 - ratio) + gradient_colors[1][0] * ratio)
            g = int(gradient_colors[0][1] * (1 - ratio) + gradient_colors[1][1] * ratio)
            b = int(gradient_colors[0][2] * (1 - ratio) + gradient_colors[1][2] * ratio)
            draw.point((x, y), fill=(r, g, b, 255))
    
    center = size // 2
    outer_radius = int(size * 0.21875)
    inner_radius = int(size * 0.09375)
    line_width = int(size * 0.03906)
    
    draw.ellipse([center - outer_radius, center - outer_radius, 
                  center + outer_radius, center + outer_radius], 
                 outline=(255, 255, 255, 255), width=line_width)
    
    draw.ellipse([center - inner_radius, center - inner_radius, 
                  center + inner_radius, center + inner_radius], 
                 fill=(255, 255, 255, 255))
    
    line_start = int(size * 0.15625)
    line_end = int(size * 0.25)
    draw.line([center + line_start, center + line_start, 
               center + line_end, center + line_end], 
              fill=(255, 255, 255, 255), width=line_width, joint='curve')
    
    dot_radius = int(size * 0.03125)
    dot_positions = [
        (int(size * 0.15625), int(size * 0.15625)),
        (int(size * 0.6875), int(size * 0.15625)),
        (int(size * 0.15625), int(size * 0.6875)),
        (int(size * 0.6875), int(size * 0.6875))
    ]
    
    dot_opacities = [204, 153, 153, 204]
    
    for (x, y), opacity in zip(dot_positions, dot_opacities):
        draw.ellipse([x - dot_radius, y - dot_radius, 
                      x + dot_radius, y + dot_radius], 
                     fill=(255, 255, 255, opacity))
    
    return img

if __name__ == '__main__':
    sizes = [16, 48, 128]
    
    for size in sizes:
        icon = create_icon(size)
        filename = f'icon{size}.png'
        icon.save(filename, 'PNG')
        print(f'Created {filename}')
    
    print('All icons created successfully!')