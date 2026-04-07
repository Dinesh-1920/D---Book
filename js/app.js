// App: init, tabs, routing, overlays, profile/history
// Global variables
let user=null,currentUser=null,entries=[],tasks=[],rooms=[],selMood='',selColor='#c9184a',pImgs=[],editId=null,curRoom=null,curPageId='',pageEditMode=false,selWeekDay=0,calMonth=new Date().getMonth(),calYear=new Date().getFullYear(),editRoomId=null,selRoomIcon='',selRoomColor=0,selRecDays=[],editTaskId=null;

// Global stubs
const BW=[80,90,100,110,120,130,140,150,160];
const COLORS=['#c9184a','#e63946','#f77f00','#fcbf49','#eae2b7','#a8dadc','#457b9d','#1d3557','#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0','#4895ef','#560bad','#7209b7','#f72585','#b5179e','#ff006e','#ffbe0b','#fb5607','#ff006e','#8338ec','#3a86ff','#06ffa5','#ff9f1c','#e71d36','#2ec4b6','#f77f00','#d62828','#003566','#fcbf49','#f77f00','#e63946','#a8dadc','#457b9d','#1d3557','#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0','#4895ef','#560bad','#7209b7','#f72585','#b5179e','#ff006e','#ffbe0b','#fb5607','#ff006e','#8338ec','#3a86ff','#06ffa5','#ff9f1c','#e71d36','#2ec4b6','#f77f00','#d62828','#003566','#fcbf49'];
const COLOR_THUMBS=['#c9184a','#e63946','#f77f00','#fcbf49','#a8dadc','#457b9d','#1d3557','#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0','#4895ef','#560bad','#7209b7','#f72585','#b5179e','#ff006e','#ffbe0b','#fb5607','#ff006e','#8338ec','#3a86ff','#06ffa5','#ff9f1c','#e71d36','#2ec4b6','#f77f00','#d62828','#003566','#fcbf49'];
const DEFAULT_ROOMS=[
  {id:'room_diary',name:'Diary',desc:'Daily thoughts and reflections',bg:'#c9184a',custom:false},
  {id:'room_journal',name:'Journal',desc:'Personal stories and experiences',bg:'#457b9d',custom:false},
  {id:'room_notes',name:'Notes',desc:'Quick ideas and reminders',bg:'#f77f00',custom:false},
  {id:'room_gratitude',name:'Gratitude',desc:'Things I\'m thankful for',bg:'#fcbf49',custom:false}
];
const PIN='1234'; // default PIN

function initApp(){
  // Auth state listener is in firebase-config.js
  // Load data
  load();
  // UI setup
  document.getElementById('lockScreen').classList.remove('hidden');
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.add('hidden');
  // Event listeners
  ['neOv','roomOv','plOv'].forEach(id=>{document.getElementById(id).addEventListener('click',function(e){if(e.target===this)this.classList.remove('op');});});
  // Keydown for PIN
  document.addEventListener('keydown',e=>{if(!document.getElementById('lockScreen').classList.contains('hidden')){if(e.key>='0'&&e.key<='9')kp(e.key);if(e.key==='Backspace')kd();}});
  // Error handler
  window.onerror=function(msg,src,line){
    console.error('App error:',msg,'at line',line);
    const t=document.getElementById('tst');
    if(t){t.textContent='Error: '+msg.slice(0,60);t.classList.add('on');setTimeout(()=>t.classList.remove('on'),4000);}
    return false;
  };
}

function load(){
  if(!user)return;
  Promise.all([
    db.collection('users').doc(user.uid).collection('entries').get().then(s=>s.docs.map(d=>({id:d.id,...d.data()}))),
    db.collection('users').doc(user.uid).collection('tasks').get().then(s=>s.docs.map(d=>({id:d.id,...d.data()}))),
    db.collection('users').doc(user.uid).collection('rooms').get().then(s=>s.docs.map(d=>({id:d.id,...d.data()})))
  ]).then(([ents,tks,rms])=>{
    entries=ents.map(e=>({...e,ts:typeof e.ts==='number'?e.ts:new Date(e.ts).getTime()}));
    tasks=tks.map(t=>({...t,due:typeof t.due==='number'?t.due:new Date(t.due).getTime()}));
    rooms=rms.length?rms:DEFAULT_ROOMS.map(r=>({...r}));
    // Apply saved theme
    const saved=localStorage.getItem('dlv5_theme');
    isDark=saved!=='light';
    applyTheme();
    openApp();
  }).catch(e=>{console.error('Load error:',e);toast('Failed to load data');});
}

function openApp(){
  document.getElementById('lockScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  switchTab('diary');
  buildDash();buildNBs();buildCal();buildPlanner();
}

// Tab switching
function switchTab(tab){
  document.querySelectorAll('.bni').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.tp').forEach(p=>p.classList.remove('on'));
  document.getElementById('bni_'+tab).classList.add('on');
  document.getElementById('tp_'+tab).classList.add('on');
  // Update FAB
  const fab=document.getElementById('fab');
  if(tab==='diary'){fab.onclick=openNE;fab.innerHTML='<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';fab.classList.remove('hid');}
  else if(tab==='rooms'){fab.onclick=openCreateRoom;fab.innerHTML='<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';fab.classList.remove('hid');}
  else if(tab==='planner'){fab.onclick=openPNew;fab.innerHTML='<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';fab.classList.remove('hid');}
  else{fab.classList.add('hid');}
}

// Auth screen
function doAuth(){
  const em=document.getElementById('authEmail').value.trim(),pw=document.getElementById('authPass').value.trim();
  if(!em||!pw){toast('Enter email and password');return;}
  const isSignUp=document.getElementById('authMode').textContent==='Sign Up';
  (isSignUp?auth.createUserWithEmailAndPassword(auth,em,pw):auth.signInWithEmailAndPassword(auth,em,pw))
    .then(u=>{currentUser=u.user;toast(isSignUp?'Account created!':'Signed in');})
    .catch(e=>{toast(e.message);});
}
function toggleAuthMode(){
  const m=document.getElementById('authMode'),f=document.getElementById('authForm');
  if(m.textContent==='Sign Up'){m.textContent='Sign In';f.innerHTML='<input id="authEmail" type="email" placeholder="Email"><input id="authPass" type="password" placeholder="Password"><button onclick="doAuth()">Sign In</button>';}
  else{m.textContent='Sign Up';f.innerHTML='<input id="authEmail" type="email" placeholder="Email"><input id="authPass" type="password" placeholder="Password"><button onclick="doAuth()">Sign Up</button>';}
}

// Lock screen
let pinAttempt='';const pdots=document.querySelectorAll('.pdot');
function kp(d){pinAttempt+=d;updatePDots();if(pinAttempt.length===4){if(pinAttempt===PIN){openApp();}else{shakePDots();pinAttempt='';}}}
function kd(){pinAttempt=pinAttempt.slice(0,-1);updatePDots();}
function updatePDots(){pdots.forEach((p,i)=>p.classList.toggle('on',i<pinAttempt.length));}
function shakePDots(){pdots.forEach(p=>{p.classList.add('err');setTimeout(()=>p.classList.remove('err'),400);});}

// Profile and History
function openProfile(){
  document.getElementById('profileOv').classList.add('op');
  const ni=document.getElementById('profileName'),nd=document.getElementById('profileNameDisplay'),av=document.getElementById('profileAvatar'),em=document.getElementById('profileEmail');
  if(ni)ni.value=currentUser.displayName||'';
  if(nd)nd.textContent=currentUser.displayName||'Anonymous';
  if(av)av.textContent=(currentUser.displayName||'A')[0].toUpperCase();
  if(em)em.textContent=currentUser.email||'—';
}
function closeProfile(){document.getElementById('profileOv').classList.remove('op');}
function saveProfile(){
  const name=document.getElementById('profileName').value.trim();
  currentUser.updateProfile({displayName:name}).then(()=>{toast('Profile updated');closeProfile();}).catch(e=>{toast('Error: '+e.message);});
}
function signOut(){
  auth.signOut().then(()=>{location.reload();}).catch(e=>{toast('Error: '+e.message);});
}
function openHistory(){
  document.getElementById('historyOv').classList.add('op');
  buildHistory();
}
function closeHistory(){document.getElementById('historyOv').classList.remove('op');}
function buildHistory(){
  const h=document.getElementById('historyList');
  const sess=JSON.parse(localStorage.getItem('dlv5_sessions')||'[]');
  if(!sess.length){h.innerHTML='<div class="emp">No session history yet.</div>';return;}
  h.innerHTML=sess.slice(-20).reverse().map(s=>'<div class="history-item"><div class="hi-date">'+new Date(s.ts).toLocaleString()+'</div><div class="hi-data">Entries: '+s.entries+', Tasks: '+s.tasks+', Rooms: '+s.rooms+'</div></div>').join('');
}

// Productivity
function buildProductivity(){
  const hmap=document.getElementById('hmap');
  const now=new Date(),days=[],cnts={};
  for(let i=0;i<49;i++){const d=new Date(now);d.setDate(now.getDate()-i);const k=d.toISOString().split('T')[0];days.push(k);cnts[k]=entries.filter(e=>new Date(e.ts).toDateString()===d.toDateString()).length;}
  const max=Math.max(...Object.values(cnts));
  hmap.innerHTML='<div class="hmap-grid">'+days.map(d=>'<div class="hc l'+(cnts[d]?(cnts[d]>=max*.75?4:cnts[d]>=max*.5?3:cnts[d]>=max*.25?2:1):0)+'"></div>').join('')+'</div><div class="hmap-legend"><div class="hl-sq l1"></div> Low <div class="hl-sq l2"></div> Medium <div class="hl-sq l3"></div> High <div class="hl-sq l4"></div> Peak</div>';
  const moodChart=document.getElementById('moodChart');
  const moods=['😊','😢','😡','😴','🤔','❤️','😎','😱','🤗','😔'];
  const moodCounts={};
  entries.forEach(e=>{if(e.mood){const i=moods.indexOf(e.mood);if(i>=0)moodCounts[i]=(moodCounts[i]||0)+1;}});
  const maxMood=Math.max(...Object.values(moodCounts));
  moodChart.innerHTML='<div class="mood-bars">'+moods.map((m,i)=>'<div class="mood-bar-col"><div class="mood-bar" style="height:'+(moodCounts[i]?(moodCounts[i]/maxMood*60):0)+'px;background:var(--M)"></div><div class="mood-bar-emoji">'+m+'</div><div class="mood-bar-num">'+(moodCounts[i]||0)+'</div></div>').join('')+'</div>';
  const tasksDone=document.getElementById('tasksDone');
  const totalTasks=tasks.length,doneTasks=tasks.filter(t=>t.done).length;
  tasksDone.innerHTML='<div class="td-row"><div class="td-label">Total Tasks</div><div class="td-bar-wrap"><div class="td-bar" style="width:100%"></div></div><div class="td-val">100%</div></div><div class="td-row"><div class="td-label">Completed</div><div class="td-bar-wrap"><div class="td-bar" style="width:'+(totalTasks?doneTasks/totalTasks*100:0)+'%"></div></div><div class="td-val">'+doneTasks+'</div></div>';
}

// Theme
let isDark=true;
function toggleTheme(){
  isDark=!isDark;
  localStorage.setItem('dlv5_theme',isDark?'dark':'light');
  applyTheme();
}
function applyTheme(){
  document.documentElement.style.setProperty('--BG',isDark?'#0a0a0f':'#f8f9fa');
  document.documentElement.style.setProperty('--S1',isDark?'#111118':'#ffffff');
  document.documentElement.style.setProperty('--S2',isDark?'#18181f':'#f1f3f4');
  document.documentElement.style.setProperty('--S3',isDark?'#1e1e28':'#e8eaed');
  document.documentElement.style.setProperty('--BR',isDark?'rgba(255,255,255,.07)':'rgba(0,0,0,.12)');
  document.documentElement.style.setProperty('--INK',isDark?'#f0eff5':'#202124');
  document.documentElement.style.setProperty('--MUT',isDark?'#6b6a7a':'#5f6368');
  document.documentElement.style.setProperty('--MUTH',isDark?'#9b9aaa':'#80868b');
}

// Toast
function toast(msg){const t=document.getElementById('tst');t.textContent=msg;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2400);}