// Planner: tasks, calendar, planner
function buildCal(){
  const now=new Date();
  const m=calMonth,y=calYear;
  const fd=new Date(y,m,1),ld=new Date(y,m+1,0);
  const sd=fd.getDay(),ed=ld.getDate();
  document.getElementById('cht').textContent=fd.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const g=document.getElementById('cg');
  let h='<div class="cdh">';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>h+='<div class="cdhi">'+d+'</div>');
  h+='</div><div class="cds">';
  for(let i=0;i<sd;i++)h+='<div class="cc om"><div class="ccn"></div></div>';
  for(let d=1;d<=ed;d++){
    const dt=new Date(y,m,d),isT=dt.toDateString()===now.toDateString();
    const es=entries.filter(e=>new Date(e.ts).toDateString()===dt.toDateString());
    const ts=tasks.filter(t=>new Date(t.due).toDateString()===dt.toDateString()&&!t.done);
    let cls='cc'+(isT?' today':'')+(es.length||ts.length?' has':'');
    h+='<div class="'+cls+'" onclick="openCalDay('+d+','+m+','+y+')"><div class="ccn">'+d+'</div>';
    if(es.length&&ts.length)h+='<div class="ccd both"></div>';
    else if(es.length)h+='<div class="ccd entry"></div>';
    else if(ts.length)h+='<div class="ccd task"></div>';
    h+='</div>';
  }
  const rem=42-(sd+ed);
  for(let i=0;i<rem;i++)h+='<div class="cc om"><div class="ccn"></div></div>';
  h+='</div>';
  g.innerHTML=h;
}
function calPrev(){calMonth--;if(calMonth<0){calMonth=11;calYear--;}buildCal();}
function calNext(){calMonth++;if(calMonth>11){calMonth=0;calYear++;}buildCal();}

function openCalDay(d,m,y){
  const dt=new Date(y,m,d);
  document.querySelectorAll('.cc').forEach(c=>c.classList.remove('sel'));
  event.target.closest('.cc').classList.add('sel');
  const p=document.getElementById('calDayPanel');
  if(p)p.remove();
  const es=entries.filter(e=>new Date(e.ts).toDateString()===dt.toDateString());
  const ts=tasks.filter(t=>new Date(t.due).toDateString()===dt.toDateString());
  if(!es.length&&!ts.length)return;
  const h='<div id="calDayPanel" class="cal-day-panel"><div class="cal-day-header"><div class="cal-day-title">'+dt.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})+'</div><div class="cal-day-close" onclick="closeCalDay()">Close</div></div>';
  let b='<div class="cal-all-wrap"><div class="cal-all-title">Entries</div>';
  if(es.length)es.forEach(e=>{const r=rooms.find(x=>x.id===e.room)||{name:'Unknown'};b+='<div class="cal-item" onclick="veGlobal(\''+e.id+'\')"><div class="cal-item-line" style="background:'+e.color+'"></div><div class="cal-item-body"><div class="cal-item-tag" style="color:'+e.color+'">'+r.name+'</div><div class="cal-item-title">'+e.title+'</div>'+(e.content?'<div class="cal-item-sub">'+e.content.slice(0,60)+(e.content.length>60?'...':'')+'</div>':'')+'</div></div>';});
  else b+='<div class="cal-empty">No entries</div>';
  b+='</div><div class="cal-all-wrap"><div class="cal-all-title">Tasks</div>';
  if(ts.length)ts.forEach(t=>{b+='<div class="cal-item" onclick="openTaskEdit(\''+t.id+'\')"><div class="cal-item-line" style="background:#4361ee"></div><div class="cal-item-body"><div class="cal-item-tag" style="color:#4361ee">Task</div><div class="cal-item-title">'+t.title+'</div>'+(t.desc?'<div class="cal-item-sub">'+t.desc.slice(0,60)+(t.desc.length>60?'...':'')+'</div>':'')+'</div></div>';});
  else b+='<div class="cal-empty">No tasks</div>';
  b+='</div></div>';
  const el=document.createElement('div');el.innerHTML=h+b+'</div>';
  document.getElementById('cw').appendChild(el.firstChild);
}
function closeCalDay(){const p=document.getElementById('calDayPanel');if(p)p.remove();document.querySelectorAll('.cc').forEach(c=>c.classList.remove('sel'));}

function buildPlanner(){
  const now=new Date();
  const wd=now.getDay(),dy=now.getDate(),mo=now.getMonth(),yr=now.getFullYear();
  const ws=document.getElementById('ws');
  ws.innerHTML='';
  for(let i=0;i<7;i++){
    const d=new Date(now);d.setDate(dy-wd+i);
    const isT=d.toDateString()===now.toDateString();
    const cnt=tasks.filter(t=>new Date(t.due).toDateString()===d.toDateString()&&!t.done).length;
    const el=document.createElement('div');el.className='wd'+(isT?' on':'');el.onclick=()=>{selWeekDay=i;buildPlanner();};
    el.innerHTML='<div class="wdd">'+d.toLocaleDateString('en-IN',{weekday:'short'})+'</div><div class="wdn">'+d.getDate()+'</div>'+(cnt?'<div class="wddt"></div>':'');
    ws.appendChild(el);
  }
  const selD=new Date(now);selD.setDate(dy-wd+selWeekDay);
  document.getElementById('phb').textContent=selD.toLocaleDateString('en-IN',{month:'long',day:'numeric'});
  const tl=document.getElementById('tl');
  const dayTasks=tasks.filter(t=>new Date(t.due).toDateString()===selD.toDateString());
  if(!dayTasks.length){tl.innerHTML='<div class="epl">No tasks for this day.<br><em>Tap the + button to add one.</em></div>';return;}
  tl.innerHTML='<div class="tll"></div>';
  dayTasks.sort((a,b)=>a.done-b.done||a.ts-b.ts).forEach((t,i)=>{
    const el=document.createElement('div');el.className='tli'+(t.done?' dn':'');el.style.animationDelay=i*.04+'s';
    el.innerHTML='<div class="tld" onclick="toggleTask(\''+t.id+'\')"></div><div class="tlc'+(t.done?'':' hl')+'" onclick="openTaskEdit(\''+t.id+'\')"><div class="tlt2" style="color:'+(t.done?'var(--MUT)':'#4361ee')+'">Task</div><div class="tlti">'+t.title+'</div>'+(t.desc?'<div class="tlno">'+t.desc+'</div>':'')+(t.rec?'<div class="tlrec">Recurring</div>':'')+'</div>';
    tl.appendChild(el);
  });
}
function toggleTask(id){
  const t=tasks.find(x=>x.id===id);if(!t)return;
  t.done=!t.done;savT();
  if(t.rec&&t.done){
    const nt={...t,id:'task_'+Date.now(),done:false,ts:t.ts,due:new Date(t.due).getTime()+t.rec*86400000};
    tasks.push(nt);savT();
  }
  buildPlanner();buildCal();
}
function openPNew(){
  editTaskId=null;selRecDays=[];document.getElementById('pTi').value='';document.getElementById('pDe').value='';document.getElementById('pDue').value='';document.querySelectorAll('.rd').forEach(r=>r.classList.remove('on'));document.getElementById('pOv').classList.add('op');
}
function closePNew(){document.getElementById('pOv').classList.remove('op');}
function saveTask(){
  const ti=document.getElementById('pTi').value.trim();if(!ti){toast('Task title required!');return;}
  const de=document.getElementById('pDe').value.trim(),due=document.getElementById('pDue').value;
  if(!due){toast('Due date required!');return;}
  const t={id:editTaskId||'task_'+Date.now(),ts:editTaskId?(tasks.find(x=>x.id===editTaskId)||{ts:Date.now()}).ts:Date.now(),title:ti,desc:de,due:new Date(due).getTime(),done:false,rec:selRecDays.length?selRecDays[0]:0};
  if(editTaskId){const i=tasks.findIndex(x=>x.id===editTaskId);if(i!==-1)tasks[i]=t;}else tasks.push(t);
  savT();closePNew();buildPlanner();buildCal();toast(editTaskId?'Task updated':'Task added');
}
function openTaskEdit(id){
  const t=tasks.find(x=>x.id===id);if(!t)return;
  editTaskId=id;selRecDays=t.rec?[t.rec]:[];document.getElementById('pTi').value=t.title;document.getElementById('pDe').value=t.desc||'';document.getElementById('pDue').value=new Date(t.due).toISOString().split('T')[0];document.querySelectorAll('.rd').forEach(r=>{r.classList.toggle('on',parseInt(r.dataset.d)===t.rec);});document.getElementById('pOv').classList.add('op');
}
function delTask(){
  if(!editTaskId){toast('No task selected.');return;}
  if(!confirm('Delete this task?'))return;
  tasks=tasks.filter(t=>t.id!==editTaskId);savT();closePNew();buildPlanner();buildCal();toast('Task deleted.');
}
function toggleRec(d){const r=document.querySelector('.rd[data-d="'+d+'"]');if(r.classList.contains('on')){r.classList.remove('on');selRecDays=selRecDays.filter(x=>x!==d);}else{document.querySelectorAll('.rd').forEach(x=>x.classList.remove('on'));r.classList.add('on');selRecDays=[d];}}