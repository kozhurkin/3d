/* ---------- export: the scene as it is on screen → one .glb (glTF 2.0, binary) ----------
   The shell's button calls exportGLB() and saves what it returns. The exporter is loaded on the first call only.
   Only the meshes on screen go: no light, lines (dimensions, outlines, door swings), texts of the dimensions, camera debug
   or parts made see-through. Opaque textures go as JPEG (the decor photos), those with transparency as PNG. */
const GLTF_EXPORTER='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js';
let exporterLoad=null;
function loadExporter(){
  if(THREE.GLTFExporter)return Promise.resolve();
  return exporterLoad||(exporterLoad=new Promise((ok,fail)=>{
    const s=document.createElement('script');s.src=GLTF_EXPORTER;
    s.onload=()=>THREE.GLTFExporter?ok():fail(new Error('GLTFExporter not found'));
    s.onerror=()=>{exporterLoad=null;fail(new Error('GLTFExporter not loaded'));};
    document.head.appendChild(s);
  }));
}
// what is left out of the file: hidden for the time of the export, then shown again
const exportSkip=o=>o===dbg||o.isLight||o.isSprite||o.isLine||(o.isMesh&&seeThrough(o.material));
function exportHide(){
  const hidden=[];
  scene.traverse(o=>{if(o.visible&&exportSkip(o)){o.visible=false;hidden.push(o);}});
  return ()=>hidden.forEach(o=>{o.visible=true;});
}
// the exporter writes a texture of RGBA format as PNG, of RGB as JPEG: the maps of opaque materials only (a map shared with
// a transparent one keeps its alpha) go as RGB for the time of the export
function exportJpeg(){
  const opaque=new Set(),alpha=new Set();
  scene.traverseVisible(o=>{if(!o.isMesh)return;[].concat(o.material).forEach(m=>{if(m&&m.map)(m.transparent||m.alphaTest>0?alpha:opaque).add(m.map);});});
  const set=[...opaque].filter(t=>!alpha.has(t)&&t.format===THREE.RGBAFormat);
  set.forEach(t=>{t.format=THREE.RGBFormat;});
  return ()=>set.forEach(t=>{t.format=THREE.RGBAFormat;});
}
// → Promise of the .glb bytes (ArrayBuffer)
function exportGLB(){
  return loadExporter().then(()=>new Promise((ok,fail)=>{
    // the exporter walks the scene and reads the formats at once (only the images are written later), so all is put back
    // right after parse()
    const show=exportHide(),fmt=exportJpeg();
    try{new THREE.GLTFExporter().parse(scene,ok,{binary:true,onlyVisible:true,maxTextureSize:2048});}
    catch(e){fail(e);}
    finally{fmt();show();}
  }));
}
