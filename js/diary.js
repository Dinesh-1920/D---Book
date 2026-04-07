// Diary: rooms, entries, page view
function buildDash(){
  const now=new Date();
  const days=[...new Set(entries.map(e=>new Date(e.ts).toDateString()))].sort((a,b)=>new Date(b)-new Date(a));
  let streak=0,chk=new Date();
  for(const d of days){const df=Math.round((chk-new Date(d))/86400000);if(df<=1){streak++;chk=new Date(d);}else break;}
  document.getElementById('dStr').innerHTML=streak+' <span style="font-size:13px;color:var(--MUT)">day streak</span>';
  const sm=document.getElementById('streakMini');sm.innerHTML='';
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);const has=days.includes(d.toDateString());const sq=document.createElement('div');sq.className='streak-sq'+(has?' on':'');sm.appendChild(sq);}

  const dr=document.getElementById('dashR');dr.innerHTML='';
  rooms.forEach(r=>{const cnt=entries.filter(e=>e.room===r.id).length;const el=document.createElement('div');el.className='rch';el.onclick=()=>openRoom(r.id);el.innerHTML='<div class="rchn">'+r.name+'</div><div class="rchc">'+cnt+' entries</div>';dr.appendChild(el);});

  const rl=document.getElementById('recL');rl.innerHTML='';
  const rec=[...entries].sort((a,b)=>b.ts-a.ts).slice(0,6);
  if(!rec.length){rl.innerHTML='<div class="emp">No entries yet. Open a room and start writing!</div>';return;}
  rec.forEach((e,i)=>{
    const r=rooms.find(x=>x.id===e.room)||{name:'Unknown'};
    const el=document.createElement('div');el.className='rec-card';el.style.animationDelay=i*.05+'s';el.onclick=()=>veGlobal(e.id);
    el.innerHTML='<div class="rec-accent" style="background:'+e.color+'"></div>'
      +'<div class="rec-row"><div class="rec-room" style="padding-left:10px">'+r.name+'</div>'+(e.mood?'<div class="rec-mood" style="margin-left:auto">'+e.mood+'</div>':'')+'</div>'
      +'<div class="rec-title" style="padding-left:10px">'+e.title+'</div>'
      +(e.content?'<div class="rec-body" style="padding-left:10px">'+e.content+'</div>':'')
      +(e.images&&e.images[0]?'<img class="rec-thumb" src="'+e.images[0]+'">':'')
      +'<div class="rec-date" style="padding-left:10px">'+fmtL(e.ts)+'</div>';
    rl.appendChild(el);
  });
}

function buildNBs(){
  const g=document.getElementById('nbGrid');g.innerHTML='';
  rooms.forEach((r,i)=>{
    const cnt=entries.filter(e=>e.room===r.id).length;
    const el=document.createElement('div');el.className='nb';el.style.animationDelay=i*.055+'s';el.onclick=()=>openRoom(r.id);
    el.innerHTML='<div class="nbc" style="background:'+r.bg+'"><div class="nbc-glow"></div><div style="position:relative;z-index:1"><div class="nbn">'+r.name+'</div><div class="nbo">'+cnt+' entr'+(cnt===1?'y':'ies')+'</div></div></div><div class="nbl"><span class="nbln">'+(r.desc||'Tap to open')+'</span><span class="nbla">›</span></div>';
    g.appendChild(el);
  });
  const add=document.createElement('div');add.className='add-room-card';add.style.animationDelay=rooms.length*.055+'s';add.onclick=openCreateRoom;add.innerHTML='<div class="arc-icon"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><div class="arc-txt">New Room</div>';g.appendChild(add);
  const wb=document.createElement('div');wb.className='nb';wb.style.animationDelay=(rooms.length+1)*.055+'s';wb.onclick=openWB;wb.innerHTML='<div class="nbc" style="background:linear-gradient(135deg,#0f0f18,#1e1e2e)"><div class="nbc-glow"></div><div style="position:relative;z-index:1"><div class="nbn">Whiteboard</div><div class="nbo">Draw & scribble</div></div></div><div class="nbl"><span class="nbln">Open board</span><span class="nbla">›</span></div>';g.appendChild(wb);
}

function openRoom(id){
  curRoom=rooms.find(r=>r.id===id);if(!curRoom)return;
  document.getElementById('rvT').textContent=curRoom.name;
  document.getElementById('rvS').textContent=curRoom.desc||'';
  document.getElementById('rvSI').value='';
  document.getElementById('roomView').classList.remove('hidden');
  renderRoom();
}
function goBack(){document.getElementById('roomView').classList.add('hidden');buildDash();buildNBs();}
function renderRoom(){
  const q=document.getElementById('rvSI').value.toLowerCase();
  const list=entries.filter(e=>e.room===curRoom.id&&(!q||(e.title+e.content).toLowerCase().includes(q)));
  const body=document.getElementById('rvB');
  if(!list.length){body.innerHTML='<div class="emp">No entries yet.<br><em>Start your '+curRoom.name.toLowerCase()+' story.</em></div>';return;}
  const grps={};list.forEach(e=>{const k=new Date(e.ts).toLocaleDateString('en-IN',{month:'long',year:'numeric'});(grps[k]=grps[k]||[]).push(e);});
  body.innerHTML='';
  Object.entries(grps).forEach(([mo,ents])=>{
    const sec=document.createElement('div');sec.className='shs';
    const shelfOuter=document.createElement('div');shelfOuter.className='shelf-outer';
    const bks=document.createElement('div');bks.className='shbk';
    [...ents].reverse().forEach((e,i)=>{
      const w=BW[i%BW.length],h=118+(i%3)*18; // bigger heights
      const b=document.createElement('div');b.className='bk';b.style.width=w+'px';
      b.onclick=()=>openPage(e.id);
      let inn='<div class="bs" style="width:'+w+'px;height:'+h+'px;background:'+e.color+'">';
      inn+='<div class="btt">'+(e.title||'Untitled')+'</div><div class="bdt">'+fmtS(e.ts)+'</div></div>';
      if(e.mood)inn+='<div class="bmd">'+e.mood+'</div>';
      b.innerHTML=inn;bks.appendChild(b);
    });
    const add=document.createElement('div');add.className='as';add.onclick=openNE;add.innerHTML='<div class="ain"><div class="aip">+</div><div class="ail">New</div></div>';bks.appendChild(add);
    shelfOuter.appendChild(bks);
    const pl=document.createElement('div');pl.className='shp';shelfOuter.appendChild(pl);
    sec.innerHTML='<div class="shm">'+mo+'</div>';sec.appendChild(shelfOuter);
    body.appendChild(sec);
  });
}

// ── PAGE VIEW ──────────────────────────────────────────────
function openPage(id){
  const e=entries.find(x=>x.id===id);if(!e)return;
  curPageId=id;pageEditMode=false;
  document.getElementById('pvT').textContent=e.title;
  document.getElementById('pvM').innerHTML=fmtL(e.ts)+(e.mood?'<span class="pvmood" style="margin-left:8px">'+e.mood+'</span>':'');
  document.getElementById('pvEditBtn').textContent='Edit';
  renderPageView(e);
  document.getElementById('pageView').classList.remove('hidden');
}
function renderPageView(e){
  const body=document.getElementById('pvBody');
  const layout=getImgLayout(e.id);
  let canvasH=Math.max(1200,window.innerHeight*2);
  if(layout.length)canvasH=Math.max(canvasH,...layout.map((l,i)=>(l.y||0)+(l.h||120)+60));
  let html='<div class="free-canvas" id="freeCanvas" style="height:'+canvasH+'px">';
  for(let i=0;i<60;i++)html+='<div style="position:absolute;left:0;right:0;top:'+(20+i*32)+'px;height:1px;background:rgba(255,255,255,.04);pointer-events:none"></div>';
  html+='<div style="position:absolute;left:44px;top:0;bottom:0;width:1px;background:rgba(201,24,74,.18);pointer-events:none"></div>';
  const tl=e.textLayout||{x:56,y:20,w:Math.max(600,window.innerWidth-120)};
  html+='<div class="free-block text-block" id="fb_text" style="left:'+tl.x+'px;top:'+tl.y+'px;width:'+tl.w+'px"><div style="font-family:\'DM Serif Display\',serif;font-size:16px;line-height:1.9;color:var(--INK);white-space:pre-wrap;padding:4px 6px;min-height:40px">'+(e.content||'<span style="color:var(--MUT);font-style:italic">No text yet. Tap Edit to write.</span>')+'</div></div>';
  if(e.images&&e.images.length){e.images.forEach((src,i)=>{const l=layout[i]||{x:60+i*20,y:200+i*20,w:180,h:140};html+='<div class="free-block img-block" id="fb_img_'+i+'" style="left:'+l.x+'px;top:'+l.y+'px;width:'+l.w+'px;height:'+l.h+'px"><img src="'+src+'"></div>';});}
  html+='</div>';
  body.innerHTML=html
    +'<div class="page-actions"><button class="pab del" onclick="window.delE(\''+e.id+'\')" >Delete</button>'
    +'<button class="pab" onclick="window.togglePageEdit()">Edit</button>'
    +'<button class="pab pri" onclick="window.closePage()">Close</button></div>';
}
function linesHTML(){let h='<div style="position:absolute;inset:0;pointer-events:none;overflow:hidden">';for(let i=0;i<80;i++)h+='<div style="position:absolute;left:0;right:0;top:'+(20+i*32)+'px;height:1px;background:rgba(255,255,255,.04)"></div>';h+='</div>';return h;}
function togglePageEdit(){
  const e=entries.find(x=>x.id===curPageId);if(!e)return;
  if(!pageEditMode){
    pageEditMode=true;document.getElementById('pvEditBtn').textContent='Done';
    window._editImgs=[...e.images||[]];
    window._editLayout=getImgLayout(e.id).map(l=>({...l}));
    window._textLayout=e.textLayout?{...e.textLayout}:{x:56,y:20,w:Math.max(600,window.innerWidth-120)};
    renderEditCanvas(e);
  }else{saveInlineEdit();}
}
function renderEditCanvas(e){
  const body=document.getElementById('pvBody');
  const layout=window._editLayout||[];
  let canvasH=Math.max(1200,window.innerHeight*2);
  if(layout.length)canvasH=Math.max(canvasH,...layout.map((l,i)=>(l.y||0)+(l.h||120)+80));
  const tw=window._textLayout.w||Math.max(600,window.innerWidth-120);
  const th=Math.max(200,((e.content||'').split('\n').length+3)*32);
  let html='<div class="free-canvas" id="freeCanvas" style="height:'+canvasH+'px;min-height:600px" onclick="window.canvasDeselect(event)">';
  for(let i=0;i<80;i++)html+='<div style="position:absolute;left:0;right:0;top:'+(20+i*32)+'px;height:1px;background:rgba(255,255,255,.04);pointer-events:none"></div>';
  html+='<div style="position:absolute;left:44px;top:0;bottom:0;width:1px;background:rgba(201,24,74,.18);pointer-events:none"></div>';
  html+='<div class="free-block text-block" id="fb_text" style="left:'+window._textLayout.x+'px;top:'+window._textLayout.y+'px;width:'+tw+'px" onpointerdown="window.textBlockDown(event)">'
    +'<textarea class="notes-edit-body" id="editBody" style="min-height:'+th+'px" placeholder="Write here..." oninput="window.autoGrowTA(this)">'+esc(e.content)+'</textarea>'
    +'<div class="blk-rsz" onpointerdown="event.stopPropagation();window.textRszDown(event)"></div>'
    +'</div>';
  (window._editImgs||[]).forEach((src,i)=>{
    const l=layout[i]||{x:60+i*22,y:220+i*22,w:180,h:140};
    html+='<div class="free-block img-block" id="fb_img_'+i+'" style="left:'+l.x+'px;top:'+l.y+'px;width:'+l.w+'px;height:'+l.h+'px" onpointerdown="window.imgBlockDown(event,'+i+')">'
      +'<img src="'+src+'"><div class="img-sel-ring"></div>'
      +'<div class="blk-del" onclick="event.stopPropagation();window.delNoteImg('+i+')">×</div>'
      +'<div class="blk-rsz" onpointerdown="event.stopPropagation();window.rszDown(event,'+i+')"></div>'
      +'</div>';
  });
  html+='</div>';
  body.innerHTML=html
    +'<div class="canvas-add-bar">'
    +'<label class="cab-btn" for="editImgPk">+ Photo</label>'
    +'<button class="cab-btn" style="margin-left:auto" onclick="window.cancelEdit()">Cancel</button>'
    +'<button class="cab-btn" style="background:var(--M);color:#fff;border-color:var(--M)" onclick="window.saveInlineEdit()">Save</button>'
    +'<button class="cab-btn" style="color:#ff6b6b" onclick="window.delE(\''+e.id+'\')" >Delete</button>'
    +'</div>';
  setTimeout(()=>{const ta=document.getElementById('editBody');if(ta){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';}},50);
}
function autoGrowTA(ta){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';const canvas=document.getElementById('freeCanvas');const fb=document.getElementById('fb_text');if(canvas&&fb){const needed=parseInt(fb.style.top)+fb.offsetHeight+80;if(needed>canvas.offsetHeight)canvas.style.height=needed+'px';}}
// Text block drag
let _tdDragging=false,_tdOx=0,_tdOy=0;
function textBlockDown(e){if(e.target.tagName==='TEXTAREA')return;const fb=document.getElementById('fb_text');if(!fb)return;_tdDragging=true;const r=fb.getBoundingClientRect();_tdOx=e.clientX-r.left;_tdOy=e.clientY-r.top;fb.setPointerCapture(e.pointerId);fb.addEventListener('pointermove',_textMove);fb.addEventListener('pointerup',_textUp);}
function _textMove(e){if(!_tdDragging)return;e.preventDefault();const canvas=document.getElementById('freeCanvas');if(!canvas)return;const fb=document.getElementById('fb_text');if(!fb)return;const cr=canvas.getBoundingClientRect();const x=Math.max(0,e.clientX-cr.left-_tdOx);const y=Math.max(0,e.clientY-cr.top-_tdOy);fb.style.left=x+'px';fb.style.top=y+'px';if(window._textLayout)window._textLayout={...window._textLayout,x,y};}
function _textUp(e){_tdDragging=false;const fb=document.getElementById('fb_text');if(fb){fb.removeEventListener('pointermove',_textMove);fb.removeEventListener('pointerup',_textUp);}}
// Text resize
let _trDragging=false,_trOx=0,_trW0=0;
function textRszDown(e){e.preventDefault();_trDragging=true;const fb=document.getElementById('fb_text');if(!fb)return;_trOx=e.clientX;_trW0=fb.offsetWidth;fb.setPointerCapture(e.pointerId);fb.addEventListener('pointermove',_textRszMove);fb.addEventListener('pointerup',_textRszUp);}
function _textRszMove(e){if(!_trDragging)return;e.preventDefault();const fb=document.getElementById('fb_text');if(!fb)return;const nw=Math.max(120,_trW0+(e.clientX-_trOx));fb.style.width=nw+'px';if(window._textLayout)window._textLayout={...window._textLayout,w:nw};}
function _textRszUp(e){_trDragging=false;const fb=document.getElementById('fb_text');if(fb){fb.removeEventListener('pointermove',_textRszMove);fb.removeEventListener('pointerup',_textRszUp);}}
function canvasDeselect(e){if(e.target.id==='freeCanvas')document.querySelectorAll('.free-block').forEach(b=>b.classList.remove('selected'));}
function handleEditPhotos(ev){
  const files=Array.from(ev.target.files);
  if(!files.length)return;
  let loaded=0;
  files.forEach(f=>{
    const rd=new FileReader();
    rd.onload=e2=>{
      if(!window._editImgs)window._editImgs=[];
      window._editImgs.push(e2.target.result);
      loaded++;
      if(loaded===files.length){
        const eid=curPageId;
        const canvas=document.getElementById('imgCanvas');
        const newCanvas=buildPhotoEditCanvas(window._editImgs,eid);
        const tmp=document.createElement('div');tmp.innerHTML=newCanvas;
        if(canvas)canvas.replaceWith(tmp.firstChild);
        else{const inner=document.querySelector('.notes-paper-inner');if(inner)inner.appendChild(tmp.firstChild);}
        toast(files.length+' photo'+(files.length>1?'s':'')+' added');
        document.getElementById('editImgPk').value='';
      }
    };
    rd.readAsDataURL(f);
  });
}
function cancelEdit(){
  pageEditMode=false;
  const e=entries.find(x=>x.id===curPageId);if(e)renderPageView(e);
  document.getElementById('pvEditBtn').textContent='Edit';
}
function saveInlineEdit(){
  const e=entries.find(x=>x.id===curPageId);if(!e)return;
  _commitImgLayout();
  const bo=document.getElementById('editBody');
  if(bo)e.content=bo.value;
  if(window._editImgs)e.images=window._editImgs;
  // Save text block position
  if(window._textLayout)e.textLayout=window._textLayout;
  savE();pageEditMode=false;
  document.getElementById('pvEditBtn').textContent='Edit';
  renderPageView(e);
  if(curRoom)renderRoom();buildDash();
  toast('Saved');
}
function esc(str){return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function closePage(){document.getElementById('pageView').classList.add('hidden');}
function openNE(){
  editId=null;pImgs=[];selMood='';selColor='#c9184a';
  document.getElementById('eTi').value='';document.getElementById('eCo').value='';document.getElementById('pvG').innerHTML='';document.getElementById('newEntryImgPk').value='';document.getElementById('wcD').textContent='0 words';document.getElementById('neT').textContent='New Entry';
  document.querySelectorAll('#neOv .mb2').forEach(m=>m.classList.remove('on'));
  document.querySelectorAll('.cb2').forEach(c=>{c.classList.remove('on');if(c.dataset.c===selColor)c.classList.add('on');});
  document.getElementById('neOv').classList.add('op');
}
function closeNE(){document.getElementById('neOv').classList.remove('op');}
function pm(el){document.querySelectorAll('#neOv .mb2').forEach(m=>m.classList.remove('on'));el.classList.add('on');selMood=el.dataset.m;}
function pc(el){document.querySelectorAll('.cb2').forEach(c=>c.classList.remove('on'));el.classList.add('on');selColor=el.dataset.c;}
function handleI(ev){Array.from(ev.target.files).forEach(f=>{const rd=new FileReader();rd.onload=e=>{pImgs.push(e.target.result);const g=document.getElementById('pvG');const img=document.createElement('img');img.className='pi';img.src=e.target.result;g.appendChild(img);};rd.readAsDataURL(f);});document.getElementById('newEntryImgPk').value='';}
function doWC(){const n=document.getElementById('eCo').value.trim().split(/\s+/).filter(Boolean).length;document.getElementById('wcD').textContent=n+' word'+(n!==1?'s':'');}
function saveE(){
  const ti=document.getElementById('eTi').value.trim(),co=document.getElementById('eCo').value.trim();
  if(!ti&&!co){toast('Write something first!');return;}
  if(!curRoom){toast('Please open a room first.');return;}
  const e={id:editId||Date.now().toString(),ts:editId?(entries.find(x=>x.id===editId)||{ts:Date.now()}).ts:Date.now(),room:curRoom.id,title:ti||'Untitled',content:co,mood:selMood,color:selColor,images:[...pImgs]};
  if(editId){const i=entries.findIndex(x=>x.id===editId);if(i!==-1)entries[i]=e;}else entries.push(e);
  savE();closeNE();renderRoom();buildDash();buildCal();toast(editId?'Entry updated':'Saved to shelf');
}
function veGlobal(id){const e=entries.find(x=>x.id===id);if(!e)return;curRoom=rooms.find(r=>r.id===e.room)||rooms[0];openPage(id);}
function delE(id){
  if(!confirm('Delete this entry?'))return;
  entries=entries.filter(e=>e.id!==id);savE();
  document.getElementById('pageView').classList.add('hidden');
  if(curRoom)renderRoom();buildDash();buildCal();toast('Entry deleted.');
}

// ROOMS
function buildIconGrid(si){selRoomIcon='';} // icon picker removed
function buildSwatches(si){const g=document.getElementById('swatchGrid');g.innerHTML='';COLOR_THUMBS.forEach((c,i)=>{const el=document.createElement('div');el.className='sw'+(i===si?' on':'');el.style.background=c;el.onclick=()=>{document.querySelectorAll('.sw').forEach(x=>x.classList.remove('on'));el.classList.add('on');selRoomColor=i;};g.appendChild(el);});}
function openCreateRoom(){editRoomId=null;selRoomIcon='';selRoomColor=0;document.getElementById('roomOvT').textContent='Create Room';document.getElementById('rName').value='';document.getElementById('rDesc').value='';document.getElementById('delRoomBtn').style.display='none';buildIconGrid('');buildSwatches(0);document.getElementById('roomOv').classList.add('op');}
function openEditRoom(){if(!curRoom)return;editRoomId=curRoom.id;selRoomIcon=curRoom.icon||'';const ci=COLORS.indexOf(curRoom.bg);selRoomColor=ci>=0?ci:0;document.getElementById('roomOvT').textContent='Edit Room';document.getElementById('rName').value=curRoom.name;document.getElementById('rDesc').value=curRoom.desc||'';document.getElementById('delRoomBtn').style.display='block';buildIconGrid(selRoomIcon);buildSwatches(selRoomColor);document.getElementById('roomOv').classList.add('op');}
function closeRoomOv(){document.getElementById('roomOv').classList.remove('op');}
function saveRoom(){
  const name=document.getElementById('rName').value.trim();if(!name){toast('Give your room a name!');return;}
  const desc=document.getElementById('rDesc').value.trim();
  if(editRoomId){const r=rooms.find(x=>x.id===editRoomId);if(r){r.name=name;r.desc=desc;r.icon=selRoomIcon;r.bg=COLORS[selRoomColor];if(curRoom&&curRoom.id===editRoomId)curRoom=r;}}
  else rooms.push({id:'room_'+Date.now(),name,desc,icon:selRoomIcon,bg:COLORS[selRoomColor],custom:true});
  savR();closeRoomOv();buildNBs();buildDash();
  if(editRoomId&&curRoom){document.getElementById('rvT').textContent=curRoom.name;document.getElementById('rvS').textContent=curRoom.desc||'';}
  toast(editRoomId?'Room updated':'Room created');
}
function deleteRoom(){
  if(!editRoomId){toast('No room selected.');return;}
  if(!confirm('Delete this room and ALL its entries?'))return;
  entries=entries.filter(e=>e.room!==editRoomId);rooms=rooms.filter(r=>r.id!==editRoomId);
  savE();savR();closeRoomOv();document.getElementById('roomView').classList.add('hidden');buildDash();buildNBs();toast('Room deleted.');
}

// ── DRAG + RESIZE IMAGE SYSTEM ────────────────────────────
// imgLayout: [{src, x, y, w, h}] stored per entry
function getImgLayout(eid){
  const e=entries.find(x=>x.id===eid);
  return(e&&e.imgLayout)||[];
}
function saveImgLayout(eid,layout){
  const e=entries.find(x=>x.id===eid);
  if(e){e.imgLayout=layout;savE();}
}

// Build READ-ONLY photo display (view mode)
function buildPhotoViewHTML(imgs,eid){
  if(!imgs||!imgs.length)return '';
  const layout=getImgLayout(eid);
  let html='<div style="position:relative;min-height:'+(layout.length?Math.max(...layout.map(l=>(l.y||0)+(l.h||120)))+20:0)+'px">';
  imgs.forEach((src,i)=>{
    const l=layout[i]||{x:10+i*20,y:10+i*20,w:140,h:110};
    html+='<div class="note-img-readonly" style="position:absolute;left:'+l.x+'px;top:'+l.y+'px;width:'+l.w+'px;height:'+l.h+'px">'
      +'<img src="'+src+'" style="width:100%;height:100%"></div>';
  });
  html+='</div>';
  return html;
}

// Build EDIT mode canvas with drag+resize
function buildPhotoEditCanvas(imgs,eid){
  if(!imgs||!imgs.length)return '<div id="imgCanvas" class="notes-canvas editing"></div>';
  const layout=getImgLayout(eid);
  const canvasH=Math.max(200,...layout.map((l,i)=>(l&&l.y?l.y:10+i*22)+(l&&l.h?l.h:120)))+40;
  let html='<div id="imgCanvas" class="notes-canvas editing" style="height:'+canvasH+'px" onclick="canvasDeselect(event)">';
  imgs.forEach((src,i)=>{
    const l=layout[i]||{x:10+i*22,y:10+i*22,w:140,h:110};
    html+='<div class="note-img-block" id="nib_'+i+'" style="left:'+l.x+'px;top:'+l.y+'px;width:'+l.w+'px;height:'+l.h+'px" '
      +'onpointerdown="window.imgBlockDown(event,'+i+')">'
      +'<img src="'+src+'">'
      +'<div class="img-sel-ring"></div>'
      +'<div class="idel" onpointerdown="event.stopPropagation()" onclick="window.delNoteImg('+i+')">×</div>'
      +'<div class="rsz" onpointerdown="event.stopPropagation();window.rszDown(event,'+i+')"><svg viewBox="0 0 10 10"><path d="M2 8 L8 8 L8 2"/></svg>'
      +'</div>'
      +'</div>';
  });
  html+='</div>';
  return html;
}

// ── Drag logic ──
let _dragIdx=-1,_dragOx=0,_dragOy=0,_dragEl=null;
let _rszIdx=-1,_rszOx=0,_rszOy=0,_rszW0=0,_rszH0=0;

function imgBlockDown(e,idx){
  if(e.target.closest('.blk-del')||e.target.closest('.blk-rsz'))return;
  e.stopPropagation();
  document.querySelectorAll('.free-block').forEach((b,i)=>b.classList.toggle('selected',b.id==='fb_img_'+idx));
  _dragIdx=idx;_dragEl=document.getElementById('fb_img_'+idx);
  if(!_dragEl)return;
  const canvas=document.getElementById('freeCanvas');if(!canvas)return;
  const br=_dragEl.getBoundingClientRect();
  _dragOx=e.clientX-br.left;_dragOy=e.clientY-br.top;
  _dragEl.setPointerCapture(e.pointerId);
  _dragEl.addEventListener('pointermove',imgBlockMove);
  _dragEl.addEventListener('pointerup',imgBlockUp);
}
function imgBlockMove(e){
  if(_dragIdx<0||!_dragEl)return;
  e.preventDefault();
  const canvas=document.getElementById('freeCanvas');if(!canvas)return;
  const cr=canvas.getBoundingClientRect();
  const x=Math.max(0,e.clientX-cr.left-_dragOx);
  const y=Math.max(0,e.clientY-cr.top-_dragOy);
  _dragEl.style.left=x+'px';_dragEl.style.top=y+'px';
  const needed=y+_dragEl.offsetHeight+20;
  if(needed>canvas.offsetHeight)canvas.style.height=needed+'px';
}
function imgBlockUp(e){
  if(_dragIdx<0||!_dragEl)return;
  _dragEl.removeEventListener('pointermove',imgBlockMove);
  _dragEl.removeEventListener('pointerup',imgBlockUp);
  _commitImgLayout();_dragIdx=-1;_dragEl=null;
}
function rszDown(e,idx){
  e.stopPropagation();e.preventDefault();
  _rszIdx=idx;
  const el=document.getElementById('fb_img_'+idx);if(!el)return;
  _rszOx=e.clientX;_rszOy=e.clientY;
  _rszW0=el.offsetWidth;_rszH0=el.offsetHeight;
  el.setPointerCapture(e.pointerId);
  el.addEventListener('pointermove',rszMove);
  el.addEventListener('pointerup',rszUp);
}
function rszMove(e){
  if(_rszIdx<0)return;e.preventDefault();
  const el=document.getElementById('fb_img_'+_rszIdx);if(!el)return;
  const nw=Math.max(60,_rszW0+(e.clientX-_rszOx));
  const nh=Math.max(50,_rszH0+(e.clientY-_rszOy));
  el.style.width=nw+'px';el.style.height=nh+'px';
  const canvas=document.getElementById('freeCanvas');
  const needed=el.offsetTop+nh+20;
  if(canvas&&needed>canvas.offsetHeight)canvas.style.height=needed+'px';
}
function rszUp(e){
  if(_rszIdx<0)return;
  const el=document.getElementById('fb_img_'+_rszIdx);
  if(el){el.removeEventListener('pointermove',rszMove);el.removeEventListener('pointerup',rszUp);}
  _commitImgLayout();_rszIdx=-1;
}
function canvasDeselect(e){
  if(e.target.id==='freeCanvas')document.querySelectorAll('.free-block').forEach(b=>b.classList.remove('selected'));

}
function _commitImgLayout(){
  const eid=curPageId;if(!eid||!window._editImgs)return;
  const layout=window._editImgs.map((_,i)=>{
    // Try new canvas IDs first, fall back to old
    const el=document.getElementById('fb_img_'+i)||document.getElementById('nib_'+i);
    if(!el)return{x:10+i*20,y:220+i*20,w:180,h:140};
    return{x:parseInt(el.style.left)||0,y:parseInt(el.style.top)||0,w:el.offsetWidth,h:el.offsetHeight};
  });
  saveImgLayout(eid,layout);
}
function delNoteImg(idx){
  if(!window._editImgs)return;
  window._editImgs.splice(idx,1);
  const eid=curPageId;
  const layout=getImgLayout(eid);layout.splice(idx,1);saveImgLayout(eid,layout);
  // Re-render the edit canvas
  const e=entries.find(x=>x.id===eid);
  if(e){window._editLayout=layout;renderEditCanvas(e);}
  toast('Image removed');
}