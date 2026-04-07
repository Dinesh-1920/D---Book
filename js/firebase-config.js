// Firebase setup and auth
const firebaseConfig = {
  apiKey: "AIzaSyBG3sbDvC60xym08SB1SCpMWz3x-k1Q660",
  authDomain: "d-book-aff71.firebaseapp.com",
  projectId: "d-book-aff71",
  storageBucket: "d-book-aff71.firebasestorage.app",
  messagingSenderId: "111389807573",
  appId: "1:111389807573:web:05a03f6a4962a38911e35c"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;
let user = null;
let authMode = 'signin'; // 'signin' or 'signup'

// ── AUTH FUNCTIONS ────────────────────────────────────────
function toggleAuthMode(){
  authMode = authMode==='signin'?'signup':'signin';
  const isSignup = authMode==='signup';
  document.getElementById('authTitle').textContent = isSignup?'Create Account':'Welcome Back';
  document.getElementById('authSub').textContent = isSignup?'Start your diary journey':'Sign in to your diary';
  document.getElementById('authBtn').textContent = isSignup?'Create Account':'Sign In';
  document.getElementById('authToggleTxt').textContent = isSignup?'Already have an account?':"Don't have an account?";
  document.getElementById('authToggleBtn').textContent = isSignup?'Sign In':'Sign Up';
  document.getElementById('authName').style.display = isSignup?'block':'none';
  document.getElementById('authErr').style.display='none';
}
function showAuthErr(msg){
  const el=document.getElementById('authErr');
  el.textContent=msg;el.style.display='block';
}
async function doAuth(){
  const email=document.getElementById('authEmail').value.trim();
  const pass=document.getElementById('authPass').value;
  const btn=document.getElementById('authBtn');
  if(!email||!pass){showAuthErr('Please enter email and password');return;}
  btn.textContent='Please wait...';btn.disabled=true;
  document.getElementById('authErr').style.display='none';
  try{
    if(authMode==='signup'){
      const name=document.getElementById('authName').value.trim()||'Dinesh';
      const cred=await auth.createUserWithEmailAndPassword(email,pass);
      await cred.user.updateProfile({displayName:name});
      await db.collection('users').doc(cred.user.uid).set({name,email,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    } else {
      await auth.signInWithEmailAndPassword(email,pass);
    }
  } catch(e){
    const msgs={'auth/email-already-in-use':'Email already registered — sign in instead',
      'auth/wrong-password':'Wrong password','auth/user-not-found':'No account with this email',
      'auth/weak-password':'Password must be at least 6 characters',
      'auth/invalid-email':'Invalid email address','auth/invalid-credential':'Wrong email or password'};
    showAuthErr(msgs[e.code]||e.message);
    btn.textContent=authMode==='signup'?'Create Account':'Sign In';btn.disabled=false;
  }
}
async function resetPassword(){
  const email=document.getElementById('authEmail').value.trim();
  if(!email){showAuthErr('Enter your email first, then click Forgot Password');return;}
  try{await auth.sendPasswordResetEmail(email);showAuthErr('Reset email sent — check your inbox');}
  catch(e){showAuthErr('Could not send reset email');}
}
async function doSignOut(){
  await auth.signOut();
}

// ── AUTH STATE LISTENER — runs when page loads ────────────
auth.onAuthStateChanged(async user=>{
  if(user){
    currentUser=user;
    user = user; // set global user
    // Load user name and PIN from Firebase
    try{
      const uDoc=await db.collection('users').doc(user.uid).get();
      const uName=uDoc.exists?uDoc.data().name:(user.displayName||'Dinesh');
      localStorage.setItem('dlv5_name',uName);
      // Sync PIN from Firebase across all devices
      if(uDoc.exists&&uDoc.data().pin){
        currentPIN=uDoc.data().pin;
        localStorage.setItem('dlv5_pin',currentPIN);
      }
    }catch(e){}
    // Hide auth screen, show PIN screen for security
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('lockScreen').classList.remove('hidden');
  } else {
    currentUser=null;
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('lockScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
  }
});

// Make functions global for HTML onclick
window.doAuth = doAuth;
window.toggleAuthMode = toggleAuthMode;
window.resetPassword = resetPassword;
window.doSignOut = doSignOut;