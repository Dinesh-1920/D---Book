// Data save/load functions
const BIG_BOOK_WIDTHS=[52,58,54,62,50,56,60]; // bigger books

const DEFAULT_ROOMS_DATA=[
  {id:'startup',name:'Startup',icon:'',desc:'Ideas, wins & lessons',bg:'linear-gradient(135deg,#c9184a,#ff4d6d)',custom:false},
  {id:'personal',name:'Personal',icon:'',desc:'Life, feelings & growth',bg:'linear-gradient(135deg,#6a2fa0,#9b59b6)',custom:false},
  {id:'dreams',name:'Dreams',icon:'',desc:'Wishes & night visions',bg:'linear-gradient(135deg,#1a5c8e,#4361ee)',custom:false},
  {id:'travel',name:'Travel',icon:'',desc:'Adventures & memories',bg:'linear-gradient(135deg,#1a6b4a,#06d6a0)',custom:false},
  {id:'gratitude',name:'Gratitude',icon:'',desc:'Thankful moments',bg:'linear-gradient(135deg,#7a4012,#e67e22)',custom:false},
  {id:'health',name:'Health',icon:'',desc:'Body, mind & energy',bg:'linear-gradient(135deg,#2e4a6b,#06d6a0)',custom:false},
];
const ICONS=['','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','',''];
const COLORS=['linear-gradient(135deg,#c9184a,#ff4d6d)','linear-gradient(135deg,#6a2fa0,#9b59b6)','linear-gradient(135deg,#1a5c8e,#4361ee)','linear-gradient(135deg,#1a6b4a,#06d6a0)','linear-gradient(135deg,#7a4012,#e67e22)','linear-gradient(135deg,#2e4a6b,#06d6a0)','linear-gradient(135deg,#4a1a1a,#c9184a)','linear-gradient(135deg,#1a1a4a,#4361ee)','linear-gradient(135deg,#1a4a1a,#27ae60)','linear-gradient(135deg,#2a2a2a,#555)'];
const COLOR_THUMBS=['#c9184a','#6a2fa0','#1a5c8e','#1a6b4a','#7a4012','#2e4a6b','#4a1a1a','#1a1a4a','#1a4a1a','#2a2a2a'];

async function loadFromCloud(){
  const uid=currentUser.uid;
  try{
    const [eSnap,tSnap,rSnap]=await Promise.all([
      db.collection('users').doc(uid).collection('entries').orderBy('ts','desc').get(),
      db.collection('users').doc(uid).collection('tasks').get(),
      db.collection('users').doc(uid).collection('rooms').get()
    ]);
    entries=eSnap.docs.map(d=>({...d.data(),id:d.id}));
    tasks=tSnap.docs.map(d=>({...d.data(),id:d.id}));
    rooms=rSnap.empty?JSON.parse(JSON.stringify(DEFAULT_ROOMS_DATA)):rSnap.docs.map(d=>({...d.data(),id:d.id}));
    if(rooms.length===0)rooms=JSON.parse(JSON.stringify(DEFAULT_ROOMS_DATA));
  }catch(e){
    console.error('Load error',e);
    entries=[];tasks=[];rooms=JSON.parse(JSON.stringify(DEFAULT_ROOMS_DATA));
  }
  trackSession();expandRecurring();
}
async function uploadImageIfNeeded(dataUrl){
  // If already a storage URL or empty, return as-is
  if(!dataUrl||dataUrl.startsWith('https://'))return dataUrl;
  if(!currentUser)return dataUrl;
  try{
    const uid=currentUser.uid;
    const fname='images/'+uid+'/'+Date.now()+'_'+Math.random().toString(36).slice(2)+'.jpg';
    const ref=storage.ref(fname);
    await ref.putString(dataUrl,'data_url');
    return await ref.getDownloadURL();
  }catch(e){console.error('Image upload error',e);return dataUrl;}
}
async function savE(){
  if(!currentUser)return;
  const uid=currentUser.uid;
  const batch=db.batch();
  // Upload images to Storage before saving entry URLs to Firestore
  for(const e of entries){
    if(e.images&&e.images.length){
      const uploaded=[];
      for(const img of e.images){
        const url=await uploadImageIfNeeded(img);
        uploaded.push(url);
      }
      e.images=uploaded;
    }
    const ref=db.collection('users').doc(uid).collection('entries').doc(e.id);
    batch.set(ref,e);
  }
  try{await batch.commit();}catch(err){console.error('savE error',err);}
}
async function savT(){
  if(!currentUser)return;
  const uid=currentUser.uid;
  const batch=db.batch();
  tasks.forEach(t=>{
    const ref=db.collection('users').doc(uid).collection('tasks').doc(t.id);
    batch.set(ref,t);
  });
  try{await batch.commit();}catch(e){console.error('savT error',e);}
}
async function savR(){
  if(!currentUser)return;
  const uid=currentUser.uid;
  const batch=db.batch();
  rooms.forEach(r=>{
    const ref=db.collection('users').doc(uid).collection('rooms').doc(r.id);
    batch.set(ref,r);
  });
  try{await batch.commit();}catch(e){console.error('savR error',e);}
}

function trackSession(){const today=new Date().toISOString().slice(0,10);let s=JSON.parse(localStorage.getItem('dlv5_sess')||'{}');s[today]=(s[today]||0)+1;localStorage.setItem('dlv5_sess',JSON.stringify(s));}

function expandRecurring(){
  const today=new Date();
  tasks.filter(t=>t.recurring&&t.recurring!=='none'&&!t.parentId).forEach(t=>{
    const base=new Date(t.date+'T12:00:00');
    for(let i=1;i<=60;i++){
      const d=new Date(base.getTime()+i*86400000);
      const ds=d.toISOString().slice(0,10);
      if(d>new Date(today.getTime()+60*86400000))break;
      const wd=d.getDay();let ok=false;
      if(t.recurring==='daily')ok=true;
      else if(t.recurring==='weekdays')ok=wd>=1&&wd<=5;
      else if(t.recurring==='weekly')ok=wd===base.getDay();
      else if(t.recurring==='custom'&&t.recDays)ok=t.recDays.includes(wd);
      if(ok&&!tasks.find(x=>x.parentId===t.id&&x.date===ds)){
        tasks.push({id:Date.now().toString()+Math.random().toString(36).slice(2),title:t.title,note:t.note,date:ds,time:t.time,type:t.type,done:false,parentId:t.id,recurring:'none',recDays:[]});
      }
    }
  });savT();
}