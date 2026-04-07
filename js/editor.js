// Editor: free canvas, drag-resize images, whiteboard
function openWB(){
  document.getElementById('wbScreen').classList.remove('hidden');
  const c=document.getElementById('wbCanvas');
  if(!c)return;
  const r=c.getBoundingClientRect();
  c.width=r.width*window.devicePixelRatio;
  c.height=r.height*window.devicePixelRatio;
  c.getContext('2d').scale(window.devicePixelRatio,window.devicePixelRatio);
  wbPaths=loadWBPaths();
  redrawWB();
}
function closeWB(){
  saveWBPaths(wbPaths);
  document.getElementById('wbScreen').classList.add('hidden');
}
function loadWBPaths(){
  const s=localStorage.getItem('wbPaths');
  return s?JSON.parse(s):[];
}
function saveWBPaths(paths){
  localStorage.setItem('wbPaths',JSON.stringify(paths));
}
function setTool(t){
  wbTool=t;
  document.querySelectorAll('.wb-tool').forEach(el=>el.classList.toggle('on',el.dataset.t===t));
}
function setColor(c){
  wbColor=c;
  document.querySelectorAll('.wb-color').forEach(el=>el.classList.toggle('on',el.style.backgroundColor===c));
}
function clearWB(){
  if(!confirm('Clear the whiteboard?'))return;
  wbPaths=[];redrawWB();
}
function redrawWB(){
  const c=document.getElementById('wbCanvas'),ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width/window.devicePixelRatio,c.height/window.devicePixelRatio);
  wbPaths.forEach(p=>{
    ctx.strokeStyle=p.c;ctx.lineWidth=p.w;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();
    p.pts.forEach((pt,i)=>{if(i===0)ctx.moveTo(pt.x,pt.y);else ctx.lineTo(pt.x,pt.y);});
    ctx.stroke();
  });
}

// Drawing logic
let wbDrawing=false,wbLastX=0,wbLastY=0,wbPaths=[],wbTool='pen',wbColor='#c9184a',wbWidth=2;
document.getElementById('wbCanvas').addEventListener('pointerdown',e=>{
  wbDrawing=true;
  const c=e.target,r=c.getBoundingClientRect();
  wbLastX=e.clientX-r.left;wbLastY=e.clientY-r.top;
  wbPaths.push({c:wbColor,w:wbWidth,pts:[{x:wbLastX,y:wbLastY}]});
  e.target.setPointerCapture(e.pointerId);
});
document.getElementById('wbCanvas').addEventListener('pointermove',e=>{
  if(!wbDrawing)return;
  const c=e.target,r=c.getBoundingClientRect();
  const x=e.clientX-r.left,y=e.clientY-r.top;
  wbPaths[wbPaths.length-1].pts.push({x,y});
  redrawWB();
});
document.getElementById('wbCanvas').addEventListener('pointerup',e=>{
  wbDrawing=false;
});

// Toolbar setup
document.querySelectorAll('.wb-tool').forEach(el=>{
  el.dataset.t=el.id.replace('wb','').toLowerCase();
  el.onclick=()=>setTool(el.dataset.t);
});
document.querySelectorAll('.wb-color').forEach(el=>{
  el.onclick=()=>setColor(el.style.backgroundColor);
});
setTool('pen');setColor('#c9184a');