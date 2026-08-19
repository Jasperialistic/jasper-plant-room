#!/usr/bin/env python3
"""Generate deterministic Plant Room PWA icons with Python stdlib only."""
from pathlib import Path
import math
import struct
import zlib

BG=(13,23,20,255)
PANEL=(21,42,36,255)
LEAF=(145,183,164,255)
ACCENT=(211,183,119,255)


def inside_rotated_ellipse(x,y,cx,cy,rx,ry,angle):
    ca=math.cos(angle); sa=math.sin(angle)
    dx=x-cx; dy=y-cy
    xr=dx*ca+dy*sa
    yr=-dx*sa+dy*ca
    return (xr*xr)/(rx*rx)+(yr*yr)/(ry*ry)<=1.0


def dist_to_segment(px,py,x1,y1,x2,y2):
    vx=x2-x1; vy=y2-y1
    wx=px-x1; wy=py-y1
    vv=vx*vx+vy*vy
    if vv==0:return math.hypot(wx,wy)
    t=max(0.0,min(1.0,(wx*vx+wy*vy)/vv))
    return math.hypot(px-(x1+t*vx),py-(y1+t*vy))


def render(size):
    data=bytearray(size*size*4)
    cx=cy=size/2
    ring_r=size*0.39
    ring_inner=size*0.365
    angle=-0.58
    for y in range(size):
        for x in range(size):
            px=x+0.5; py=y+0.5
            d=math.hypot(px-cx,py-cy)
            color=BG
            if d<=ring_r: color=ACCENT
            if d<=ring_inner: color=PANEL

            # Main leaf, deliberately kept inside the maskable safe area.
            if inside_rotated_ellipse(px,py,size*0.47,size*0.43,size*0.12,size*0.225,angle):
                color=LEAF
            # Smaller companion leaf.
            if inside_rotated_ellipse(px,py,size*0.60,size*0.55,size*0.085,size*0.16,0.72):
                color=LEAF
            # Central stems / veins.
            if dist_to_segment(px,py,size*0.37,size*0.65,size*0.55,size*0.27)<=max(1.0,size*0.010):
                color=ACCENT
            if dist_to_segment(px,py,size*0.50,size*0.61,size*0.66,size*0.43)<=max(1.0,size*0.008):
                color=ACCENT

            i=(y*size+x)*4
            data[i:i+4]=bytes(color)
    return data


def write_png(path,size):
    rgba=render(size)
    raw=bytearray()
    stride=size*4
    for y in range(size):
        raw.append(0)
        raw.extend(rgba[y*stride:(y+1)*stride])

    def chunk(kind,payload):
        return struct.pack('>I',len(payload))+kind+payload+struct.pack('>I',zlib.crc32(kind+payload)&0xffffffff)

    png=b'\x89PNG\r\n\x1a\n'
    png+=chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))
    png+=chunk(b'IDAT',zlib.compress(bytes(raw),9))
    png+=chunk(b'IEND',b'')
    Path(path).write_bytes(png)


if __name__=='__main__':
    write_png('pwa-icon-192.png',192)
    write_png('pwa-icon-512.png',512)
    write_png('apple-touch-icon.png',180)
    print('Generated Plant Room PWA icons.')
