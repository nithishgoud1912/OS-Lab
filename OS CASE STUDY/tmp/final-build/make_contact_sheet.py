from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
src=Path(r'C:\Users\HP\Documents\OS record\OS CASE STUDY\tmp\final-build\ppt-render-v9')
thumb_w=480; thumb_h=270; gap=18; label_h=28; cols=4; rows=5
canvas=Image.new('RGB',(cols*thumb_w+(cols+1)*gap,rows*(thumb_h+label_h)+(rows+1)*gap),'#E7EAED')
d=ImageDraw.Draw(canvas); f=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',18)
for i in range(1,21):
 p=src/f'slide-{i:02d}.png'; im=Image.open(p).convert('RGB').resize((thumb_w,thumb_h))
 x=gap+(i-1)%cols*(thumb_w+gap); y=gap+(i-1)//cols*(thumb_h+label_h+gap)
 canvas.paste(im,(x,y)); d.text((x,y+thumb_h+3),f'Slide {i}',font=f,fill='#17202A')
canvas.save(src/'contact-sheet.png')
