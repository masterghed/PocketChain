// ==========================================
// POCKETCHAIN - FULL SCRIPT (UI + FIREBASE)
// ==========================================

import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged, signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { 
    doc, getDoc, setDoc, updateDoc, collection, addDoc, 
    onSnapshot, serverTimestamp, query, where 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// --- GLOBAL VARIABLES ---
window.currentUserData = null;
window.selectedAPY = 0;
window.selectedPeriod = 0;
window.isDarkMode = localStorage.getItem('pocketchain_darkmode') !== 'false';

// --- INITIALIZATION ---
window.onload = () => {
    window.applyTheme(window.isDarkMode);
    window.initCharts();
    window.showPage('home');
};

// ==========================================
// 1. FIREBASE AUTHENTICATION & DATA
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginMenu').classList.add('hidden');
        document.getElementById('privateMenu').classList.remove('hidden');
        document.getElementById('accountMenu').classList.remove('hidden');
        
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                window.currentUserData = docSnap.data();
                window.updateUIWithUserData();
            }
        });
        window.loadActiveStakes(user.uid);
    } else {
        window.currentUserData = null;
        document.getElementById('loginMenu').classList.remove('hidden');
        document.getElementById('privateMenu').classList.add('hidden');
        document.getElementById('accountMenu').classList.add('hidden');
        window.showPage('home');
    }
});

window.handleLogin = async () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.closeAuthModal();
        window.showToast('Success', 'Welcome back!');
        window.showPage('asset');
    } catch (error) {
        document.getElementById('loginError').textContent = error.message;
        document.getElementById('loginError').style.display = 'block';
    }
};

window.handleSignup = async () => {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    const fname = document.getElementById('regFirstName').value;
    const lname = document.getElementById('regLastName').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            firstName: fname,
            lastName: lname,
            email: email,
            balancePCH: 10000, 
            isVerified: false,
            createdAt: serverTimestamp(),
            referralCode: fname.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random() * 9000)
        });
        window.closeAuthModal();
        window.showToast('Success', 'Account created! +10,000 PCH bonus.');
        window.showPage('asset');
    } catch (error) {
        document.getElementById('signupError').textContent = error.message;
        document.getElementById('signupError').style.display = 'block';
    }
};

window.logout = async () => {
    await signOut(auth);
    location.reload();
};

window.updateUIWithUserData = () => {
    if(!window.currentUserData) return;
    const data = window.currentUserData;
    
    // Update all balance displays
    const elements = ['availableBalance', 'stakeBalanceDisplay', 'withdrawAvailableBalance', 'sendAvailableBalance', 'convertFromBalance'];
    elements.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).textContent = data.balancePCH.toLocaleString();
    });
    if(document.getElementById('balanceUsd')) document.getElementById('balanceUsd').textContent = `≈ $${(data.balancePCH * 0.045).toLocaleString()} USD`;
    
    // Update Account info
    if(document.getElementById('accountFullName')) document.getElementById('accountFullName').textContent = `${data.firstName} ${data.lastName}`;
    if(document.getElementById('accountEmail')) document.getElementById('accountEmail').textContent = data.email;
    if(document.getElementById('referralCodeDisplay')) document.getElementById('referralCodeDisplay').textContent = data.refer
