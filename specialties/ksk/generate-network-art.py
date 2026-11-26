"""Original network RPG pixel art. Rebuild with Python + Pillow.

Committed PNGs need no build step on Vercel. One source pixel = two map units.
Native-resolution drawing throughout: stepped lighting, bevels, no antialiasing.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import random
OUT=Path(__file__).parent/'network-art'
OUT.mkdir(exist_ok=True)
INK,EDGE,METAL,LIGHT='#170f26','#88769c','#4d4266','#c8b9d5'
def canvas(w,h):
    global im,d
    im=Image.new('RGBA',(w,h));d=ImageDraw.Draw(im)
def r(x,y,w,h,c):
    if w>0 and h>0:d.rectangle((x,y,x+w-1,y+h-1),fill=c)
def poly(points,c):d.polygon(points,fill=c)
def line(points,c,width=1):d.line(points,fill=c,width=width)
def ellipse(x,y,w,h,c):d.ellipse((x,y,x+w-1,y+h-1),fill=c)
def pool(x,y,rx,ry,color,strength=22):
    global im,d
    for scale in (1,.78,.55,.32):
        a,b=int(rx*scale),int(ry*scale)
        layer=Image.new('RGBA',im.size)
        ImageDraw.Draw(layer).ellipse((x-a,y-b,x+a,y+b),fill=(*color,strength))
        im=Image.alpha_composite(im,layer)
    d=ImageDraw.Draw(im)
def shadow(x,y,w,h):pool(x+w//2,y+h//2,w//2,h//2,(8,4,19),35)
def panel(x,y,w,h,c=METAL):
    r(x,y,w,h,INK);r(x+1,y+1,w-2,h-2,c);r(x+1,y+1,w-2,1,EDGE)
    r(x+1,y+2,1,h-4,'#756181');r(x+2,y+h-2,w-3,1,'#292037')
def box(x,y,w,h,depth=5,c=METAL,top='#89769b',side='#332842'):
    poly([(x,y),(x+depth,y-depth),(x+w+depth,y-depth),(x+w,y)],top)
    poly([(x+w,y),(x+w+depth,y-depth),(x+w+depth,y+h-depth),(x+w,y+h)],side)
    panel(x,y,w,h,c)
    line([(x,y-1),(x+depth,y-depth-1),(x+w+depth,y-depth-1)],LIGHT)
    line([(x+w+depth,y-depth),(x+w+depth,y+h-depth)],INK)
def save(name):im.save(OUT/(name+'.png'))
def plant(x,y):
    shadow(x-3,y+22,24,10);line([(x+9,y+24),(x+8,y+7)],'#537957',2)
    for dx,dy in [(1,8),(8,2),(0,0),(10,11),(3,14)]:
        pts=[(x+dx+5,y+dy+11),(x+dx,y+dy+5),(x+dx,y+dy+1),(x+dx+5,y+dy),(x+dx+8,y+dy+4)]
        poly(pts,'#294c49');line(pts[:4],'#629a72');r(x+dx+3,y+dy+3,2,3,'#90b881')
    poly([(x+2,y+20),(x+16,y+20),(x+14,y+31),(x+5,y+31)],'#9b6b8d')
    r(x+3,y+21,12,2,'#d2a2b4');r(x+5,y+24,2,5,'#bd8fa7');r(x+11,y+24,3,6,'#65445f')
    ellipse(x+2,y+18,15,5,'#e1b5bd');ellipse(x+4,y+19,11,3,'#382638')
def cabinet(x,y,w=29,warm=False,books=False):
    shadow(x-2,y+30,w+12,14)
    box(x,y,w,34,5,'#785064' if warm else '#624865','#a17686','#3d2a49')
    for j in range(3):
        yy=y+3+j*10;panel(x+3,yy,w-6,9,'#976d78' if warm else '#7a5a7f')
        if books:
            r(x+4,yy+1,w-8,6,'#251b31')
            for i in range((w-9)//4):
                col=['#b889ab','#637ea3','#b9a16d','#7f9b8a','#a45f85'][(i+j)%5]
                r(x+5+i*4,yy+1+i%2,3,6-i%2,col);r(x+5+i*4,yy+2,2,1,'#dfb9b3')
        else:r(x+w//2-4,yy+3,8,2,'#392535');r(x+w//2-3,yy+3,6,1,'#dab5a2')
    r(x+2,y+34,4,3,INK);r(x+w-5,y+34,4,3,INK)
def paper(x,y):
    for j in range(3):box(x,y-j*2,17,2,3,'#c4b3c0','#f2dfd0','#8c7b9b')
    for j in range(3):r(x+4,y-4+j,8-j,1,'#ac9cba')
def carton(x,y):
    shadow(x-2,y+13,27,8);box(x,y,20,17,5,'#a67562','#d5a37e','#745065')
    r(x+9,y,3,17,'#cfaa89');poly([(x+9,y-1),(x+14,y-5),(x+17,y-5),(x+12,y-1)],'#edd0a1')
    panel(x+3,y+5,5,5,'#d8bd9d');r(x+4,y+7,3,1,'#7c6073')
def rack(x,y):
    shadow(x-3,y+49,44,12);box(x,y,32,53,5,'#403551','#776380','#251d38')
    r(x+3,y+3,26,46,'#19182b');r(x+1,y+2,1,48,'#a595ba')
    for j in range(5):
        yy=y+5+j*9;panel(x+4,yy,24,8,'#4a425d');r(x+6,yy+2,16,4,'#171b2d')
        for k in range(7):r(x+7+k*2,yy+3,1,2,'#697089')
        r(x+25,yy+2,1,2,'#78efb1');r(x+25,yy+5,1,1,'#e9b770')
    for j in range(9):line([(x+34,y+6+j*4),(x+36,y+4+j*4)],'#66577b')
    r(x+3,y+53,5,2,INK);r(x+25,y+53,5,2,INK)
def monitor(x,y,design=False):
    box(x,y,35,24,3,'#655d7d','#b1a0c0','#372d49')
    r(x+2,y+2,31,19,'#15223e');r(x+3,y+3,29,2,'#79649e' if design else '#37668d')
    if design:
        r(x+6,y+7,18,12,'#ceb1c2');r(x+7,y+8,16,10,'#a685b3')
        poly([(x+8,y+17),(x+14,y+9),(x+22,y+17)],'#6c4f98');ellipse(x+16,y+8,5,5,'#f2c394')
        for j in range(5):r(x+27,y+6+j*3,3,2,['#e7a5ce','#9982dd','#7acbdb','#edcc8b','#88b6a4'][j])
        for j in range(4):r(x+3,y+7+j*3,2,2,'#9b9bbd')
    else:
        for j in range(6):
            r(x+4,y+7+j*2,1,1,'#657595');r(x+7+j%3*2,y+7+j*2,5+j%4,1,['#7edbda','#c9a0de','#dfc698'][j%3]);r(x+18,y+7+j*2,7+j%4,1,'#568bb1')
    r(x+15,y+24,5,5,'#746384');r(x+11,y+28,14,2,'#b0a0bb');r(x+30,y+22,2,1,'#96ead4')
def workstation(design=False):
    canvas(64,76);shadow(0,49,64,24)
    box(3,36,53,9,6,'#825466','#bd8a83','#553b58')
    for j in range(6):line([(8+j*7,31),(4+j*7,34)],'#d0a093')
    r(5,37,49,1,'#e2b8a0');r(6,46,4,17,'#65425a');r(7,46,1,14,'#b27e80');r(51,45,4,17,'#593d56')
    box(10,46,13,15,2,'#80536b','#a27385','#482d48')
    for yy in (48,54):panel(11,yy,11,6,'#976680');r(15,yy+2,4,1,'#d4ad9f')
    pool(27,34,22,8,(82,173,221),28);monitor(7,5,design)
    box(47,20,11,20,3,'#514461','#8c7c9c','#2e233e')
    r(49,23,7,2,'#201b31');r(49,27,6,1,'#9d8bab');r(55,30,2,2,'#86eec6')
    for j in range(3):r(49,33+j*2,4,1,'#251f36')
    box(17,38,23,4,2,'#413448','#8c7489','#2d2335')
    for j in range(2):
        for k in range(10):r(19+k*2,39+j*2,1,1,'#baa4bc')
    ellipse(43,37,5,5,'#c8b7cf');r(45,38,1,2,'#796987')
    shadow(17,64,31,11);r(30,59,3,10,'#a193b5');line([(21,71),(31,68),(41,71)],'#766482',2)
    for x in (20,30,40):r(x,71,3,3,'#21162e')
    poly([(19,53),(22,50),(40,50),(44,54),(43,62),(21,62),(18,59)],'#33233f')
    poly([(20,53),(24,51),(39,51),(42,54),(40,58),(23,58)],'#8b669a' if design else '#647997')
    poly([(20,48),(22,44),(39,44),(42,47),(41,54),(22,55)],'#30243f')
    poly([(22,47),(24,45),(38,45),(40,47),(39,52),(23,52)],'#a77db2' if design else '#7898b4')
    line([(24,46),(37,46)],'#ccb0d3' if design else '#a7c2d4');r(18,53,3,6,'#34243d');r(42,53,3,6,'#34243d')
for name in ('pc','design'):workstation(name=='design');save(name)
for kind in ('router','switch'):
    canvas(88,44);shadow(2,31,84,12)
    if kind=='router':
        for x in (11,74):
            poly([(x,24),(x-2,4),(x-1,1),(x+2,1),(x+3,4),(x+3,24)],'#21152f')
            line([(x,3),(x+1,21)],'#bca4c6');r(x-1,22,6,4,'#695476')
    box(3,27,77,11,5,'#655573','#a18dab','#392b4c')
    poly([(7,25),(11,18),(78,18),(82,22),(79,25)],'#8b799b')
    for i in range(13):line([(16+i*4,20),(14+i*4,23)],'#564361')
    for i in range(8 if kind=='switch' else 2):
        x=9+i*9 if kind=='switch' else 26+i*26
        panel(x,29,7,6,'#161a2a');r(x+2,30,3,1,'#e0ba80');r(x+1,33,5,1,'#526172')
    r(78,32,2,2,'#7be4b1');r(7,37,5,2,INK);r(72,37,5,2,INK);save(kind)
canvas(40,64);rack(2,4);save('server')
canvas(64,64);shadow(1,50,62,13);box(9,43,43,14,5,'#72546e','#a07890','#39283f')
panel(12,46,36,8,'#956c86');r(27,49,8,2,'#d0adab')
box(19,7,25,19,4,'#97869f','#d8c5d2','#60506c');r(22,7,22,16,'#efe2d1')
for j in range(4):r(25,10+j*3,14-j%2*4,1,'#9c9ab2')
box(6,27,47,19,5,'#b0a1b6','#e1cddb','#6e607f');r(9,29,41,2,'#ead8df');panel(11,34,29,6,'#252237')
poly([(17,36),(37,36),(39,46),(17,46)],'#f3e5d5')
for j in range(3):r(20,39+j*2,14,1,'#a6a0b5')
panel(43,30,8,6,'#253a51');r(45,31,4,2,'#6bd4c4');r(45,39,2,2,'#99efb3')
for j in range(4):r(55,29+j*3,2,1,'#51435f')
save('printer')
canvas(64,40);shadow(6,23,52,15)
pts=[(16,10),(10,14),(8,21),(11,28),(19,32),(39,32),(48,27),(51,19),(47,11),(38,7),(25,8),(20,14),(20,23),(28,27),(37,24),(39,18)]
line(pts,INK,6);line(pts,'#9a65b5',4);line([(x,y-1) for x,y in pts],'#d4a4e4')
for x,y in ((12,7),(36,13)):
    box(x,y,8,10,3,'#aba1bc','#ded8da','#6a5a85');r(x+2,y,4,3,'#e5bd7d')
    for j in range(3):r(x+2+j*2,y+1,1,3,'#fff0be')
save('cable')
canvas(64,40);pool(32,20,31,19,(107,92,226),25)
poly([(8,15),(14,15),(14,9),(20,9),(20,5),(39,5),(39,9),(46,9),(46,14),(54,14),(54,19),(59,19),(59,29),(54,33),(9,33),(5,29),(5,20)],'#20203e')
line([(8,16),(15,16),(15,10),(21,10),(21,6),(38,6),(38,10),(45,10),(45,15),(53,15)],'#a69de8',2)
ellipse(24,10,20,20,'#78c2de');ellipse(26,12,16,16,'#293b68');line([(25,19),(42,19)],'#a5e3e7')
line([(32,12),(30,17),(30,24),(33,28)],'#a5e3e7');line([(36,12),(38,17),(38,24),(35,28)],'#a5e3e7');save('internet')
def sconce(x,y):
    pool(x+4,y+14,23,24,(242,159,90),16);panel(x,y,9,12,'#65445a');r(x+3,y+9,3,7,'#c99376')
    poly([(x-1,y+2),(x+2,y-2),(x+7,y-2),(x+10,y+2),(x+8,y+8),(x+1,y+8)],'#e8b57d')
    r(x+2,y,5,6,'#ffe5ad');r(x+3,y+1,3,3,'#fff4d3')
for kind,accent,base in [('dev','#8f9de4','#594760'),('design','#cd8de5','#5e466d'),('print','#dca77c','#705667'),('server','#818ede','#383753')]:
    canvas(220,120);rng=random.Random(37);shadow(0,9,220,111)
    poly([(5,24),(208,24),(217,34),(217,113),(207,119),(10,119),(3,111),(3,33)],'#21162f');r(10,26,199,84,base)
    if kind!='server':
        for yy in range(29,111,8):
            for xx in range(-20+(yy//8%2)*19,210,38):
                c=rng.choice(['#684f68','#73566e','#62485f']) if kind=='print' else rng.choice(['#59445f','#604866','#654e6b'])
                r(max(10,xx),yy,min(xx+37,209)-max(10,xx),7,c);line([(max(10,xx),yy+7),(min(xx+37,208),yy+7)],'#38283f')
                for j in range(3):
                    px=max(11,xx)+rng.randrange(24)
                    if px<204:r(px,yy+2+j,4,1,'#826280' if j%2 else '#4e394f')
    else:
        for yy in range(28,111,12):
            for xx in range(10,209,16):
                r(xx,yy,15,11,rng.choice(['#42405d','#46415f','#3c3a56']));r(xx+1,yy,13,1,'#635578');r(xx+2,yy+8,2,1,'#514a69')
    r(10,28,199,7,'#302039');r(10,35,199,3,'#3d2a48');r(10,29,5,78,'#35243f');r(15,32,3,76,'#44304e')
    box(5,11,203,19,6,'#665078','#aa84b5','#382843')
    for yy in (16,24):
        r(8,yy,198,1,'#493652')
        for xx in range(13+(yy%3)*9,205,27):r(xx,yy-5,1,5,'#4d3957')
    poly([(4,10),(10,5),(16,10),(16,106),(10,113),(4,108)],'#805e91')
    poly([(16,13),(20,16),(20,104),(16,108)],'#3e2b4e');line([(5,11),(5,106),(10,111)],'#bb91c9',2)
    poly([(207,12),(213,6),(219,11),(219,107),(213,114),(207,109)],'#735081')
    line([(208,12),(213,8),(217,11),(217,106)],'#ba8cc3',2)
    box(10,111,197,6,5,'#563e68','#9c76af','#32203f');r(13,112,192,1,'#c19acb')
    pool(114,80,95,48,(151,66,205),10)
    for xx in (28,184):sconce(xx,15)
    panel(60,14,103,13,'#32213e');r(62,15,99,1,accent);r(64,25,95,1,'#66457c')
    if kind in ('dev','design'):
        plant(21,39);cabinet(180,44,25,books=True)
        if kind=='dev':
            box(43,38,30,16,2,'#443650','#a183ab','#38273e')
            for j in range(3):r(47,41+j*4,20-j*4,1,'#ad99bc')
        else:
            box(45,38,30,17,2,'#7d588b','#be91ca','#442a56')
            for j in range(6):r(49+j%3*7,41+j//3*6,5,4,['#e9a49e','#e3c880','#9ac9bf','#8aace1','#b698e1','#d789c3'][j])
            paper(184,42)
    elif kind=='print':
        cabinet(23,54,30,True);cabinet(177,47,26,True);paper(25,51);paper(180,44);carton(160,88);carton(178,81)
        plant(26,80);box(65,38,24,17,2,'#a07b83','#d0a6a5','#604258');r(69,40,9,12,'#e5c7ad');r(80,42,5,5,'#b9a0b5')
    else:
        rack(165,48);rack(128,48);box(24,38,29,18,3,'#56516d','#9988ae','#30283f')
        for j in range(6):r(27,41+j*2,22,1,'#201e33')
        box(24,83,40,7,4,'#765775','#b18b9e','#48334f');r(27,90,3,15,'#a07a95');r(59,90,3,15,'#5c3d61')
        monitor(27,58);pool(43,86,21,9,(81,150,227),18)
    save('room-'+kind)
canvas(600,300);r(0,0,600,300,'#21182e');rng=random.Random(8)
for yy in range(0,300,16):
    for xx in range(0,600,24):
        r(xx,yy,23,15,rng.choice(['#30223e','#322440','#352642']));r(xx+1,yy+1,21,1,'#41304f');r(xx+3,yy+12,2,1,'#3e2d4c')
pool(300,150,110,150,(123,58,170),12)
for xx in (242,355):r(xx,60,2,222,'#4e355f');r(xx+1,62,1,218,'#735084')
save('floor')
# Local raster heading: 1-bit mask keeps the Cyrillic glyphs crisp.
font_path=Path('C:/Windows/Fonts/consolab.ttf')
if font_path.exists():
    font=ImageFont.truetype(str(font_path),18);text='ПРОКЛАДКА СЕТИ';bounds=font.getbbox(text)
    mask=Image.new('1',(bounds[2]+2,bounds[3]-bounds[1]+2))
    ImageDraw.Draw(mask).text((1,1-bounds[1]),text,font=font,fill=1)
    title=Image.new('RGBA',mask.size);title.paste('#eee0ff',(0,0),mask);title.save(OUT/'title.png')
