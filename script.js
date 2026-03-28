// ==========================================
// POCKETCHAIN - FULL FIREBASE INTEGRATION
// ==========================================

import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged, signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { 
    doc, getDoc, setDoc, updateDoc, collection, addDoc, 
    onSnapshot, serverTimestamp, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// --- GLOBAL VARIABLES ---
window.currentUserData = null;
window.walletConnected = false;
window.walletAddress = null;
window.selectedPool = null;
window.selectedAPY = 0;
window.selectedPeriod = 0;
window.isDarkMode = localStorage.getItem('pocketchain_darkmode') !== 'false';
window.convertDirection = 'pchToCrypto';

// --- INITIALIZATION ---
window.onload = () => {
    applyTheme(window.isDarkMode);
    initCharts();
    window.showPage('home');
};

// --- AUTHENTICATION (FIREBASE) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        document.getElementById('loginMenu').classList.add('hidden');
        document.getElementById('privateMenu').classList.remove('hidden');
        document.getElementById('accountMenu').classList.remove('hidden');
        
        // Listen to Realtime Database Changes
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                window.currentUserData = docSnap.data();
                updateUIWithUserData();
            }
        });

        // Load Active Stakes
        loadActiveStakes(user.uid);
    } else {
        // User is logged out
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
    const errorEl = document.getElementById('loginError');
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.closeAuthModal();
        window.showToast('Success', 'Welcome back to PocketChain!');
        window.showPage('asset');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
    }
};

window.handleSignup = async () => {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    const fname = document.getElementById('regFirstName').value;
    const lname = document.getElementById('regLastName').value;
    const errorEl = document.getElementById('signupError');

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Initialize user in Firestore
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            firstName: fname,
            lastName: lname,
            email: email,
            balancePCH: 10000, // Starting bonus
            walletAddress: null,
            isVerified: false,
            createdAt: serverTimestamp(),
            referralCode: generateReferralCode(fname),
            totalEarned: 0
        });

        window.closeAuthModal();
        window.showToast('Success', 'Account created! You received 10,000 PCH bonus.');
        window.showPage('asset');
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
    }
};

window.logout = async () => {
    await signOut(auth);
    window.showToast('Success', 'Logged out successfully');
    location.reload();
};

function updateUIWithUserData() {
    if(!window.currentUserData) return;
    
    const data = window.currentUserData;
    
    // Balances
    const elements = ['availableBalance', 'stakeBalanceDisplay', 'withdrawAvailableBalance', 'sendAvailableBalance', 'convertFromBalance'];
    elements.forEach(id => {
        if(document.getElementById(id)) {
            document.getElementById(id).textContent = data.balancePCH.toLocaleString();
        }
    });

    if(document.getElementById('balanceUsd')) {
        document.getElementById('balanceUsd').textContent = `≈ $${(data.balancePCH * 0.045).toLocaleString()} USD`;
    }

    // Account Page
    if(document.getElementById('accountFullName')) document.getElementById('accountFullName').textContent = `${data.firstName} ${data.lastName}`;
    if(document.getElementById('accountEmail')) document.getElementById('accountEmail').textContent = data.email;
    if(document.getElementById('referralCodeDisplay')) document.getElementById('referralCodeDisplay').textContent = data.referralCode || '-----';
    
    // KYC Status
    const badge = document.getElementById('kycStatusBadge');
    if(badge) {
        if(data.isVerified) {
            badge.className = 'kyc-badge verified';
            badge.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
        } else {
            badge.className = 'kyc-badge unverified';
            badge.innerHTML = '<i class="fas fa-times-circle"></i> Not Verified';
        }
    }
}

// --- STAKING LOGIC (FIREBASE) ---
window.selectPool = (element, period, apy) => {
    document.querySelectorAll('.staking-pool').forEach(p => p.classList.remove('selected'));
    element.classList.add('selected');
    
    window.selectedPeriod = period;
    window.selectedAPY = apy;
    
    const btn = document.getElementById('stakeBtnPro');
    btn.disabled = false;
    btn.textContent = `Stake Now (${apy}% APY)`;
    window.calculateProEarnings();
};

window.stakePro = async () => {
    if (!auth.currentUser || !window.currentUserData) return window.showToast('Error', 'Please login first', 'error');
    
    const amount = parseFloat(document.getElementById('stakeAmountPro').value);
    if (!amount || amount <= 0) return window.showToast('Error', 'Enter a valid amount', 'error');
    if (amount > window.currentUserData.balancePCH) return window.showToast('Error', 'Insufficient balance', 'error');

    try {
        // Create Stake Record
        await addDoc(collection(db, "stakes"), {
            userId: auth.currentUser.uid,
            amount: amount,
            apy: window.selectedAPY,
            period: window.selectedPeriod,
            startDate: serverTimestamp(),
            status: 'active'
        });

        // Deduct Balance
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            balancePCH: window.currentUserData.balancePCH - amount
        });

        window.showToast('Success', 'Successfully staked ' + amount + ' PCH!');
        document.getElementById('stakeAmountPro').value = '';
    } catch (e) {
        window.showToast('Error', e.message, 'error');
    }
};

async function loadActiveStakes(uid) {
    const container = document.getElementById('activePositions');
    if(!container) return;

    const q = query(collection(db, "stakes"), where("userId", "==", uid), where("status", "==", "active"));
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-coins"></i><p>No active stakes</p></div>`;
            return;
        }

        let html = '';
        snapshot.forEach((docSnap) => {
            const stake = docSnap.data();
            const reward = (stake.amount * (stake.apy / 100) * (stake.period / 365)).toFixed(2);
            html += `
            <div class="card" style="margin-bottom: 10px; border-left: 3px solid var(--secondary);">
                <div style="display:flex; justify-content:space-between;">
                    <strong>${stake.amount.toLocaleString()} PCH</strong>
                    <span style="color:var(--secondary);">${stake.apy}% APY</span>
                </div>
                <div style="font-size: 0.8rem; color:var(--text-muted); margin-top:5px;">
                    Est. Reward: +${reward} PCH <br>
                    Period: ${stake.period} Days
                </div>
            </div>`;
        });
        container.innerHTML = html;
    });
}

window.calculateProEarnings = () => {
    const amount = parseFloat(document.getElementById('stakeAmountPro').value) || 0;
    const preview = document.getElementById('earnPreviewPro');
    
    if (amount > 0 && window.selectedAPY > 0) {
        const annualReward = amount * (window.selectedAPY / 100);
        const dailyReward = annualReward / 365;
        const totalReward = dailyReward * window.selectedPeriod;
        
        document.getElementById('totalReturnPro').textContent = `+${totalReward.toFixed(2)} PCH`;
        document.getElementById('dailyEarningsPro').textContent = `+${dailyReward.toFixed(2)} PCH`;
        preview.classList.add('show');
    } else {
        preview.classList.remove('show');
    }
};

window.setMaxStake = () => {
    if(window.currentUserData) {
        document.getElementById('stakeAmountPro').value = window.currentUserData.balancePCH;
        window.calculateProEarnings();
    }
};

// --- AIRDROP & TASKS ---
window.claimDailyReward = async () => {
    if (!auth.currentUser) return window.showToast('Error', 'Please login first', 'error');
    
    try {
        const reward = 10;
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            balancePCH: window.currentUserData.balancePCH + reward
        });
        window.showToast('Success', `Daily claimed! +${reward} PCH added.`);
        document.getElementById('dailyClaimBtn').disabled = true;
        document.getElementById('dailyClaimBtn').textContent = 'Claimed Today';
    } catch (e) { console.error(e); }
};

window.completeTask = async (platform) => {
    if (!auth.currentUser) return window.showToast('Error', 'Please login first', 'error');
    
    try {
        const reward = 10;
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            balancePCH: window.currentUserData.balancePCH + reward
        });
        window.showToast('Success', `Task completed! +${reward} PCH`);
        const btn = document.getElementById(`task-${platform}`);
        btn.disabled = true;
        btn.textContent = 'Claimed';
        btn.style.background = '#333';
    } catch (e) { console.error(e); }
};

// --- UI & NAVIGATION ---
window.showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    document.querySelectorAll('#sideMenu a').forEach(a => a.classList.remove('active'));
    const navItem = document.getElementById('nav-' + pageId);
    if(navItem) navItem.classList.add('active');

    window.scrollTo(0, 0);
    const menu = document.getElementById('sideMenu');
    if (menu.classList.contains('open')) window.toggleMenu();
};

window.toggleMenu = () => {
    document.getElementById('sideMenu').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
};

// --- MODALS ---
window.openAuthModal = (type) => {
    document.getElementById('authModal').classList.add('active');
    window.switchAuth(type);
};
window.closeAuthModal = () => document.getElementById('authModal').classList.remove('active');

window.switchAuth = (type) => {
    if (type === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
};

// --- WALLET UNLOCK SIMULATION ---
window.unlockWithPassphrase = () => {
    document.getElementById('passphraseModal').classList.add('active');
};
window.closePassphraseModal = () => {
    document.getElementById('passphraseModal').classList.remove('active');
};
window.confirmPassphraseUnlock = () => {
    if (!auth.currentUser) return window.showToast('Error', 'Please login first', 'error');
    window.closePassphraseModal();
    document.getElementById('unlockButtons').classList.add('hidden');
    document.getElementById('walletLockedState').classList.add('hidden');
    document.getElementById('walletContent').classList.remove('hidden');
    window.showToast('Success', 'Wallet Unlocked');
};
window.unlockWithFingerprint = () => {
    if (!auth.currentUser) return window.showToast('Error', 'Please login first', 'error');
    document.getElementById('unlockButtons').classList.add('hidden');
    document.getElementById('walletLockedState').classList.add('hidden');
    document.getElementById('walletContent').classList.remove('hidden');
    window.showToast('Success', 'Biometric Verified');
};

// --- UTILS & THEME ---
window.toggleTheme = () => {
    window.isDarkMode = !window.isDarkMode;
    localStorage.setItem('pocketchain_darkmode', window.isDarkMode);
    applyTheme(window.isDarkMode);
};

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.remove('light-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    } else {
        document.body.classList.add('light-mode');
        document.getElementById('themeIcon').className = 'fas fa-moon';
    }
    initCharts(); // Re-render charts for color change
}

window.togglePassword = (inputId, btn) => {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
};

window.showToast = (title, message, type = 'success') => {
    const toast = document.getElementById('toast');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    
    const icon = toast.querySelector('.toast-icon');
    icon.className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} toast-icon`;
    icon.style.color = type === 'success' ? 'var(--secondary)' : 'var(--danger)';
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};

function generateReferralCode(name) {
    const prefix = name ? name.substring(0, 3).toUpperCase() : 'PCH';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
}

// --- CHARTS (CHART.JS) ---
let tokenomicsChartInst = null;
let priceChartInst = null;

function initCharts() {
    const textColor = window.isDarkMode ? '#fff' : '#1a1a2e';
    const gridColor = window.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    // Tokenomics Chart
    const ctx1 = document.getElementById('tokenomicsChart');
    if (ctx1) {
        if(tokenomicsChartInst) tokenomicsChartInst.destroy();
        tokenomicsChartInst = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Staking', 'Liquidity', 'Team', 'Development', 'Airdrop', 'Reserve'],
                datasets: [{
                    data: [40, 20, 15, 10, 10, 5],
                    backgroundColor: ['#00c2ff', '#00ff88', '#7000ff', '#ff4757', '#ffa502', '#8b9bb4'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: textColor } }
                }
            }
        });
    }

    // Market Price Chart
    const ctx2 = document.getElementById('priceChart');
    if (ctx2) {
        if(priceChartInst) priceChartInst.destroy();
        priceChartInst = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'PCH Price (USD)',
                    data: [0.038, 0.041, 0.039, 0.042, 0.044, 0.043, 0.045],
                    borderColor: '#00c2ff',
                    backgroundColor: 'rgba(0, 194, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: gridColor }, ticks: { color: textColor } },
                    x: { grid: { color: gridColor }, ticks: { color: textColor } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}
