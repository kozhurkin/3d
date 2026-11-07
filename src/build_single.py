import json,re
dec=open('decors.js',encoding='utf-8').read()
shell=open('shell.html',encoding='utf-8').read()
bridge='<script>(function(){var p=parent;["PHOTO_GAIN","DECORS","PALETTE_WOOD","PALETTE_UNI"].forEach(function(k){window[k]=p[k];});window.renderPalette=new Function("return "+p.renderPalette.toString())();})();</script>'
pages={k:open(k+'.html',encoding='utf-8').read().replace('<script src="decors.js"></script>',bridge) for k in ['hall','bath','kitchen']}
js='const PAGES='+json.dumps(pages,ensure_ascii=False).replace('</','<\\/')+';'
body=shell.replace('<script>\n(function(){','<script>\n'+dec.replace('</','<\\/')+'\n'+js+'\n(function(){',1)
open('index.html','w',encoding='utf-8').write(body)
nometa=re.sub(r'<meta name="claude:viewport-fit-sides"[^>]*>\n','',body)
out='<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n<style>body{margin:0}[hidden]{display:none!important}</style>\n'+nometa.replace('<header','</head><body>\n<header',1)+'\n</body></html>\n'
open('single.html','w',encoding='utf-8').write(out)
print('ok',len(out)//1024)
