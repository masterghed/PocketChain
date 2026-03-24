// ==========================================
// POCKETCHAIN (PCH) - PROFESSIONAL DEFI PLATFORM
// UPDATED: Airdrop Referral, Attendance Streak, Convert, KYC, Enhanced Signup
// ==========================================

// --- STATE MANAGEMENT ---
let currentUser = null;
let walletConnected = false;
let walletAddress = null;
let walletBalance = 10000;
let selectedPool = null;
let selectedAPY = 0;
let selectedPeriod = 0;
let isDarkMode = localStorage.getItem('pocketchain_darkmode') !== 'false';

// Data Storage
let stakes = JSON.parse(localStorage.getItem('pocketchain_stakes') || '[]');
let users = JSON.parse(localStorage.getItem('pocketchain_users') || '[]');
let completedTasks = JSON.parse(localStorage.getItem('pocketchain_tasks') || '[]');
let transactions = JSON.parse(localStorage.getItem('pocketchain_transactions') || '[]');
let attendanceData = JSON.parse(localStorage.getItem('pocketchain_attendance') || '{}');
let referrals = JSON.parse(localStorage.getItem('pocketchain_referrals') || '{}');

// Admin Credentials
const ADMIN_CREDENTIALS = { 
    user: "Masterghed", 
    pass: "PocketChain" 
};

// Token Configuration
const TOKEN_CONFIG = {
    name: "PocketChain",
    symbol: "PCH",
    totalSupply: 1000000000,
    decimals: 18,
    price: 0.045
};

// Conversion rates (mock)
const CONVERSION_RATES = {
    USDT: 0.045,
    USDC: 0.045,
    BTC: 0.00000068,
    ETH: 0.000025,
    SOL: 0.0032,
    XRP: 0.12,
    POL: 0.08
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔷 PocketChain Platform Loading...');
    
    applyTheme();
    checkAuthState();
    initCharts();
    updateAllStats();
    startPriceUpdates();
    setupEventListeners();
    initAttendanceSystem();
    initReferralSystem();
    initPasswordStrength();
    initDateSync();
    
    // Ensure menu is closed on load
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    
    console.log('✅ Platform loaded successfully');
});

// --- THEME SYSTEM ---
function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('pocketchain_darkmode', isDarkMode);
    applyTheme();
    showToast(isDarkMode ? 'Dark Mode' : 'Light Mode', 'Theme updated successfully');
}

function applyTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (isDarkMode) {
        body.classList.remove('light-mode');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
    } else {
        body.classList.add('light-mode');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

// --- PASSWORD STRENGTH ---
function initPasswordStrength() {
    const passwordInput = document.getElementById('regPassword');
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('strengthText');
    
    if (!passwordInput || !strengthBar || !strengthText) return;
    
    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);
        
        strengthBar.className = 'strength-bar';
        if (password.length === 0) {
            strengthBar.style.width = '0%';
            strengthText.textContent = '';
        } else if (strength < 30) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak';
            strengthText.className = 'strength-text weak';
        } else if (strength < 60) {
            strengthBar.classList.add('moderate');
            strengthText.textContent = 'Moderate';
            strengthText.className = 'strength-text moderate';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong';
            strengthText.className = 'strength-text strong';
        }
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    return score;
}

// --- DATE SYNC FOR AGE ---
function initDateSync() {
    const daySelect = document.getElementById('regDay');
    const monthSelect = document.getElementById('regMonth');
    const yearSelect = document.getElementById('regYear');
    const ageInput = document.getElementById('regAge');
    
    if (!daySelect || !monthSelect || !yearSelect || !ageInput) return;
    
    // Populate days
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
    
    // Populate months
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    months.forEach((month, idx) => {
        const option = document.createElement('option');
        option.value = idx + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    // Populate years (18-100 years old)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 18; i >= currentYear - 100; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
    
    // Calculate age on change
    function calculateAge() {
        const day = parseInt(daySelect.value);
        const month = parseInt(monthSelect.value) - 1;
        const year = parseInt(yearSelect.value);
        
        if (!day || isNaN(month) || !year) return;
        
        const birthDate = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        ageInput.value = age;
    }
    
    daySelect.addEventListener('change', calculateAge);
    monthSelect.addEventListener('change', calculateAge);
    yearSelect.addEventListener('change', calculateAge);
}

// --- REFERRAL SYSTEM ---
function initReferralSystem() {
    updateReferralUI();
}

function generateReferralCode() {
    if (!currentUser) return null;
    return `PCH${currentUser.id.toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

function getReferralCode() {
    if (!currentUser) return null;
    if (!referrals[currentUser.id]) {
        referrals[currentUser.id] = {
            code: generateReferralCode(),
            invited: [],
            rewards: 0,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('pocketchain_referrals', JSON.stringify(referrals));
    }
    return referrals[currentUser.id].code;
}

function copyReferralCode() {
    const code = getReferralCode();
    if (!code) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    navigator.clipboard.writeText(`https://pocketchain.network/ref/${code}`).then(() => {
        showToast('Copied!', 'Referral link copied to clipboard');
    }).catch(() => {
        showToast('Error', 'Failed to copy', 'error');
    });
}

function updateReferralUI() {
    if (!currentUser) return;
    
    const code = getReferralCode();
    const userReferrals = referrals[currentUser.id] || { invited: [], rewards: 0 };
    
    const codeDisplay = document.getElementById('referralCodeDisplay');
    const invitedCount = document.getElementById('invitedCount');
    const referralRewards = document.getElementById('referralRewards');
    const inviteList = document.getElementById('inviteList');
    
    if (codeDisplay) codeDisplay.textContent = code;
    if (invitedCount) invitedCount.textContent = userReferrals.invited.length;
    if (referralRewards) referralRewards.textContent = `${userReferrals.rewards} PCH`;
    
    if (inviteList) {
        if (userReferrals.invited.length === 0) {
            inviteList.innerHTML = '<p class="empty-invites">No invites yet. Share your code!</p>';
        } else {
            inviteList.innerHTML = userReferrals.invited.map(inv => `
                <div class="invite-item">
                    <span>${inv.email}</span>
                    <span class="invite-status">${inv.status}</span>
                </div>
            `).join('');
        }
    }
}

// --- ATTENDANCE SYSTEM ---
function initAttendanceSystem() {
    checkDailyAttendance();
    updateAttendanceUI();
}

function checkDailyAttendance() {
    if (!currentUser) return;
    
    const today = new Date().toDateString();
    const userId = currentUser.id;
    
    if (!attendanceData[userId]) {
        attendanceData[userId] = {
            lastClaim: null,
            streak: 0,
            totalClaims: 0,
            history: []
        };
    }
    
    const userAttendance = attendanceData[userId];
    const lastClaim = userAttendance.lastClaim ? new Date(userAttendance.lastClaim) : null;
    
    // Check if can claim (new day)
    if (!lastClaim || new Date().toDateString() !== lastClaim.toDateString()) {
        // Check if streak continues (claimed yesterday)
        if (lastClaim) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastClaim.toDateString() !== yesterday.toDateString()) {
                userAttendance.streak = 0; // Reset streak
            }
        }
        
        // Enable claim button
        const claimBtn = document.getElementById('dailyClaimBtn');
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.textContent = 'Claim Daily Reward';
            claimBtn.classList.remove('claimed');
        }
    } else {
        // Already claimed today
        const claimBtn = document.getElementById('dailyClaimBtn');
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Already Claimed Today';
            claimBtn.classList.add('claimed');
        }
    }
    
    localStorage.setItem('pocketchain_attendance', JSON.stringify(attendanceData));
}

function claimDailyReward() {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    const today = new Date().toDateString();
    const userId = currentUser.id;
    const userAttendance = attendanceData[userId];
    
    // Check if already claimed
    if (userAttendance.lastClaim && new Date(userAttendance.lastClaim).toDateString() === today) {
        showToast('Error', 'Already claimed today', 'error');
        return;
    }
    
    // Update streak
    userAttendance.streak++;
    userAttendance.lastClaim = new Date().toISOString();
    userAttendance.totalClaims++;
    userAttendance.history.push({
        date: new Date().toISOString(),
        reward: 1,
        streak: userAttendance.streak
    });
    
    // Calculate reward
    let reward = 1; // Base 1 PCH
    let bonus = 0;
    
    // 7-day streak bonus
    if (userAttendance.streak % 7 === 0) {
        bonus = 5;
        reward += bonus;
        showToast('Streak Bonus!', `7-day streak! +${bonus} PCH bonus!`, 'success');
    }
    
    // Add to wallet
    walletBalance += reward;
    updateWalletDisplays();
    recordTransaction('Daily Claim', reward, 'Completed');
    
    // Save attendance
    localStorage.setItem('pocketchain_attendance', JSON.stringify(attendanceData));
    
    // Update UI
    updateAttendanceUI();
    checkDailyAttendance();
    
    const bonusMsg = bonus > 0 ? ` (+${bonus} bonus)` : '';
    showToast('Claimed!', `+${reward} PCH${bonusMsg}`, 'success');
}

function updateAttendanceUI() {
    if (!currentUser) return;
    
    const userAttendance = attendanceData[currentUser.id] || { streak: 0, totalClaims: 0 };
    
    const streakDisplay = document.getElementById('attendanceStreak');
    const totalClaims = document.getElementById('totalClaims');
    const nextBonus = document.getElementById('nextBonus');
    
    if (streakDisplay) streakDisplay.textContent = `${userAttendance.streak} days`;
    if (totalClaims) totalClaims.textContent = userAttendance.totalClaims;
    
    if (nextBonus) {
        const daysUntilBonus = 7 - (userAttendance.streak % 7);
        nextBonus.textContent = daysUntilBonus === 7 ? 'Bonus Ready!' : `${daysUntilBonus} days`;
    }
}

// --- CONVERT SYSTEM ---
function openConvertModal() {
    if (!walletConnected) {
        showToast('Error', 'Connect wallet first', 'error');
        return;
    }
    
    const modal = document.getElementById('convertModal');
    if (modal) {
        modal.classList.add('active');
        updateConvertRates();
    }
}

function closeConvertModal() {
    const modal = document.getElementById('convertModal');
    if (modal) modal.classList.remove('active');
}

function updateConvertRates() {
    const pchAmount = parseFloat(document.getElementById('convertFromAmount')?.value) || 0;
    const toCurrency = document.getElementById('convertToCurrency')?.value || 'USDT';
    
    if (pchAmount <= 0) {
        document.getElementById('convertToAmount').value = '0.00';
        return;
    }
    
    const rate = CONVERSION_RATES[toCurrency];
    const result = (pchAmount * rate).toFixed(toCurrency === 'BTC' || toCurrency === 'ETH' ? 8 : 2);
    document.getElementById('convertToAmount').value = result;
}

function executeConvert() {
    const pchAmount = parseFloat(document.getElementById('convertFromAmount')?.value);
    const toCurrency = document.getElementById('convertToCurrency')?.value;
    
    if (!pchAmount || pchAmount <= 0) {
        showToast('Error', 'Enter valid amount', 'error');
        return;
    }
    
    if (pchAmount > walletBalance) {
        showToast('Error', 'Insufficient PCH balance', 'error');
        return;
    }
    
    const rate = CONVERSION_RATES[toCurrency];
    const convertedAmount = (pchAmount * rate).toFixed(toCurrency === 'BTC' || toCurrency === 'ETH' ? 8 : 2);
    
    // Deduct PCH
    walletBalance -= pchAmount;
    updateWalletDisplays();
    
    // Record transaction
    recordTransaction(`Convert to ${toCurrency}`, -pchAmount, 'Completed');
    
    // Add to convert history
    const history = JSON.parse(localStorage.getItem('pocketchain_convert_history') || '[]');
    history.unshift({
        from: 'PCH',
        to: toCurrency,
        fromAmount: pchAmount,
        toAmount: convertedAmount,
        rate: rate,
        date: new Date().toISOString(),
        txId: 'TX' + Date.now()
    });
    localStorage.setItem('pocketchain_convert_history', JSON.stringify(history));
    
    closeConvertModal();
    showToast('Converted!', `${pchAmount} PCH → ${convertedAmount} ${toCurrency}`, 'success');
    
    // Reset form
    document.getElementById('convertFromAmount').value = '';
    document.getElementById('convertToAmount').value = '0.00';
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Stake amount input listener
    const stakeInput = document.getElementById('stakeAmountPro');
    if (stakeInput) {
        stakeInput.addEventListener('input', calculateProEarnings);
    }
    
    // Convert listeners
    const convertFrom = document.getElementById('convertFromAmount');
    const convertCurrency = document.getElementById('convertToCurrency');
    if (convertFrom) convertFrom.addEventListener('input', updateConvertRates);
    if (convertCurrency) convertCurrency.addEventListener('change', updateConvertRates);
    
    // Close modals on outside click
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') && event.target.classList.contains('active')) {
            if (event.target === event.target.closest('.modal')) {
                closeAllModals();
            }
        }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllModals();
            const menu = document.getElementById('sideMenu');
            const overlay = document.getElementById('overlay');
            if (menu && menu.classList.contains('open')) {
                menu.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            }
        }
    });
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
}

// --- AUTHENTICATION STATE ---
function checkAuthState() {
    const savedUser = localStorage.getItem('pocketchain_currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPrivateUI();
    } else {
        showPublicUI();
    }
    
    // Check saved wallet
    const savedWallet = localStorage.getItem('pocketchain_wallet');
    if (savedWallet) {
        const wallet = JSON.parse(savedWallet);
        if (wallet.connected) {
            walletConnected = true;
            walletAddress = wallet.address;
            walletBalance = wallet.balance || 10000;
            updateWalletButton();
            updateWalletDisplays();
        }
    }
    
    // Update theme button visibility
    updateThemeButtonVisibility();
}

function updateThemeButtonVisibility() {
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.style.display = 'flex';
    }
}

function showPrivateUI() {
    const publicMenu = document.getElementById('publicMenu');
    const loginMenu = document.getElementById('loginMenu');
    const privateMenu = document.getElementById('privateMenu');
    const accountMenu = document.getElementById('accountMenu');
    
    if (publicMenu) publicMenu.classList.add('hidden');
    if (loginMenu) loginMenu.classList.add('hidden');
    
    if (privateMenu) privateMenu.classList.remove('hidden');
    if (accountMenu) accountMenu.classList.remove('hidden');
    
    updateAccountInfo();
    updateAttendanceUI();
    updateReferralUI();
    initAttendanceSystem();
    
    showPage('asset');
}

function showPublicUI() {
    const publicMenu = document.getElementById('publicMenu');
    const loginMenu = document.getElementById('loginMenu');
    const privateMenu = document.getElementById('privateMenu');
    const accountMenu = document.getElementById('accountMenu');
    
    if (publicMenu) publicMenu.classList.remove('hidden');
    if (loginMenu) loginMenu.classList.remove('hidden');
    
    if (privateMenu) privateMenu.classList.add('hidden');
    if (accountMenu) accountMenu.classList.add('hidden');
    
    showPage('home');
    updateThemeButtonVisibility();
}

// --- MENU & NAVIGATION ---
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    
    if (!menu) return;
    
    const isOpen = menu.classList.contains('open');
    
    if (isOpen) {
        menu.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        menu.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#sideMenu a').forEach(a => a.classList.remove('active'));
    
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    } else {
        return;
    }
    
    const navMap = {
        'home': 'nav-home',
        'tokenomics': 'nav-tokenomics',
        'asset': 'nav-asset',
        'staking': 'nav-staking',
        'market': 'nav-market',
        'airdrop': 'nav-airdrop',
        'account': 'nav-account'
    };
    
    Object.values(navMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    
    if (navMap[pageId]) {
        const navEl = document.getElementById(navMap[pageId]);
        if (navEl) navEl.classList.add('active');
    }
    
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('open')) {
        toggleMenu();
    }
    
    if (pageId === 'asset') updateAssetPage();
    if (pageId === 'staking') updateStakingPage();
    if (pageId === 'market') initPriceChart();
    if (pageId === 'airdrop') updateAirdropPage();
    if (pageId === 'account') updateAccountInfo();
    if (pageId === 'tokenomics') initTokenomicsChart();
    
    window.scrollTo(0, 0);
}

// --- WALLET FUNCTIONS ---
function openWalletModal() {
    if (walletConnected) {
        disconnectWallet();
    } else {
        const modal = document.getElementById('walletModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
}

function closeWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) modal.classList.remove('active');
}

function connectWallet(type) {
    walletConnected = true;
    walletAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    updateWalletButton();
    updateWalletDisplays();
    
    localStorage.setItem('pocketchain_wallet', JSON.stringify({
        address: walletAddress,
        balance: walletBalance,
        connected: true
    }));
    
    closeWalletModal();
    showToast('Wallet Connected', `${type.charAt(0).toUpperCase() + type.slice(1)} connected successfully`);
}

function updateWalletButton() {
    const btn = document.getElementById('walletBtn');
    if (!btn) return;
    
    if (walletConnected && walletAddress) {
        const shortAddress = walletAddress.substring(0, 6) + '...' + walletAddress.substring(38);
        btn.innerHTML = `<i class="fas fa-check-circle"></i><span>${shortAddress}</span>`;
        btn.classList.add('connected');
    } else {
        btn.innerHTML = `<i class="fas fa-wallet"></i><span>Connect Wallet</span>`;
        btn.classList.remove('connected');
    }
}

function disconnectWallet(silent = false) {
    walletConnected = false;
    walletAddress = null;
    
    updateWalletButton();
    
    const stakeDisplay = document.getElementById('stakeBalanceDisplay');
    const receiveInput = document.getElementById('receiveAddress');
    
    if (stakeDisplay) stakeDisplay.textContent = '0.00';
    if (receiveInput) receiveInput.value = 'Not connected';
    
    localStorage.removeItem('pocketchain_wallet');
    
    if (!silent) showToast('Disconnected', 'Wallet disconnected');
}

function updateWalletDisplays() {
    if (!walletAddress) return;
    
    const displays = {
        'stakeBalanceDisplay': walletBalance.toFixed(2),
        'receiveAddress': walletAddress
    };
    
    Object.entries(displays).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'receiveAddress') {
                el.value = value;
            } else {
                el.textContent = value;
            }
        }
    });
}

// --- ASSET PAGE ---
function updateAssetPage() {
    const totalStaked = stakes.filter(s => !s.claimed).reduce((sum, s) => sum + s.amount, 0);
    const totalRewards = stakes.filter(s => !s.claimed).reduce((sum, s) => sum + s.earnings, 0);
    const available = walletBalance;
    const total = available + totalStaked + totalRewards;
    
    const totalBalance = document.getElementById('totalBalance');
    const availableBalance = document.getElementById('availableBalance');
    const stakedBalance = document.getElementById('stakedBalance');
    const rewardsBalance = document.getElementById('rewardsBalance');
    
    if (totalBalance) totalBalance.textContent = formatTokenAmount(total);
    if (availableBalance) availableBalance.textContent = formatTokenAmount(available);
    if (stakedBalance) stakedBalance.textContent = formatTokenAmount(totalStaked);
    if (rewardsBalance) rewardsBalance.textContent = formatTokenAmount(totalRewards);
    
    const rate = TOKEN_CONFIG.price;
    const assetSub = document.querySelector('.asset-sub');
    if (assetSub) assetSub.textContent = `≈ $${(total * rate).toFixed(2)} USD`;
    
    updateTransactionHistory();
}

function formatTokenAmount(amount) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PCH';
}

function updateTransactionHistory() {
    const container = document.getElementById('transactionHistory');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exchange-alt"></i>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.slice(0, 10).map(tx => `
        <div class="tx-row">
            <div class="tx-info">
                <div class="tx-type">${tx.type}</div>
                <div class="tx-date">${new Date(tx.date).toLocaleDateString()}</div>
            </div>
            <div class="tx-amount-section">
                <div class="tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}">${tx.amount > 0 ? '+' : ''}${tx.amount} PCH</div>
                <div class="tx-status">${tx.status}</div>
            </div>
        </div>
    `).join('');
}

// Send/Receive/Withdraw
function openSendModal() {
    if (!walletConnected) {
        showToast('Error', 'Connect wallet first', 'error');
        return;
    }
    const modal = document.getElementById('sendModal');
    if (modal) modal.classList.add('active');
}

function closeSendModal() {
    const modal = document.getElementById('sendModal');
    if (modal) modal.classList.remove('active');
    
    const address = document.getElementById('sendAddress');
    const amount = document.getElementById('sendAmount');
    if (address) address.value = '';
    if (amount) amount.value = '';
}

function executeSend() {
    const address = document.getElementById('sendAddress');
    const amount = document.getElementById('sendAmount');
    
    if (!address || !amount) return;
    
    const addressVal = address.value.trim();
    const amountVal = parseFloat(amount.value);
    
    if (!addressVal || !amountVal || amountVal <= 0) {
        showToast('Error', 'Invalid input', 'error');
        return;
    }
    
    if (amountVal > walletBalance) {
        showToast('Error', 'Insufficient balance', 'error');
        return;
    }
    
    walletBalance -= amountVal;
    updateWalletDisplays();
    
    recordTransaction('Send', -amountVal, 'Completed');
    
    closeSendModal();
    updateAssetPage();
    showToast('Success', `Sent ${amountVal} PCH`);
}

function openReceiveModal() {
    if (!walletConnected) {
        showToast('Error', 'Connect wallet first', 'error');
        return;
    }
    const modal = document.getElementById('receiveModal');
    if (modal) modal.classList.add('active');
}

function closeReceiveModal() {
    const modal = document.getElementById('receiveModal');
    if (modal) modal.classList.remove('active');
}

function copyAddress() {
    if (!walletAddress) return;
    
    navigator.clipboard.writeText(walletAddress).then(() => {
        showToast('Copied', 'Address copied to clipboard');
    }).catch(() => {
        const input = document.getElementById('receiveAddress');
        if (input) {
            input.select();
            document.execCommand('copy');
            showToast('Copied', 'Address copied to clipboard');
        }
    });
}

function openWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) modal.classList.add('active');
}

function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) modal.classList.remove('active');
}

// --- STAKING PRO ---
function updateStakingPage() {
    updateWalletDisplays();
    updateActivePositions();
}

function selectPool(element, period, apy) {
    document.querySelectorAll('.staking-pool').forEach(p => p.classList.remove('selected'));
    element.classList.add('selected');
    
    selectedPool = period;
    selectedAPY = apy;
    selectedPeriod = period;
    
    calculateProEarnings();
    
    const btn = document.getElementById('stakeBtnPro');
    if (btn) {
        btn.textContent = 'Stake Now';
        btn.disabled = false;
    }
}

function setMaxStake() {
    if (!walletConnected) {
        showToast('Error', 'Connect wallet first', 'error');
        return;
    }
    const input = document.getElementById('stakeAmountPro');
    if (input) {
        input.value = walletBalance.toFixed(2);
        calculateProEarnings();
    }
}

function calculateProEarnings() {
    const input = document.getElementById('stakeAmountPro');
    if (!input) return;
    
    const amount = parseFloat(input.value) || 0;
    
    const earnPreview = document.getElementById('earnPreviewPro');
    const totalReturn = document.getElementById('totalReturnPro');
    const dailyEarnings = document.getElementById('dailyEarningsPro');
    const errorEl = document.getElementById('stakeError');
    
    if (amount > 0 && selectedAPY > 0) {
        const earnings = amount * (selectedAPY / 100) * (selectedPeriod / 365);
        const total = amount + earnings;
        const daily = earnings / selectedPeriod;
        
        if (totalReturn) totalReturn.textContent = total.toFixed(2) + ' PCH';
        if (dailyEarnings) dailyEarnings.textContent = daily.toFixed(4) + ' PCH';
        if (earnPreview) earnPreview.style.display = 'block';
        
        if (errorEl) {
            if (amount > walletBalance) {
                errorEl.classList.add('show');
            } else {
                errorEl.classList.remove('show');
            }
        }
    } else {
        if (earnPreview) earnPreview.style.display = 'none';
    }
}

function stakePro() {
    if (!walletConnected) {
        showToast('Error', 'Connect wallet first', 'error');
        return;
    }
    if (!currentUser) {
        showToast('Error', 'Login required', 'error');
        return;
    }
    
    const input = document.getElementById('stakeAmountPro');
    if (!input) return;
    
    const amount = parseFloat(input.value);
    
    if (!amount || amount <= 0) {
        showToast('Error', 'Enter valid amount', 'error');
        return;
    }
    if (!selectedPool) {
        showToast('Error', 'Select a pool', 'error');
        return;
    }
    if (amount > walletBalance) {
        showToast('Error', 'Insufficient balance', 'error');
        return;
    }
    
    const minAmounts = { 7: 100, 180: 1000, 365: 5000, 1825: 10000 };
    if (amount < minAmounts[selectedPool]) {
        showToast('Error', `Minimum ${minAmounts[selectedPool]} PCH required`, 'error');
        return;
    }
    
    walletBalance -= amount;
    updateWalletDisplays();
    
    const earnings = amount * (selectedAPY / 100) * (selectedPeriod / 365);
    const stake = {
        id: Date.now(),
        amount: amount,
        period: selectedPool,
        apy: selectedAPY,
        startDate: new Date().toISOString(),
        unlockDate: new Date(Date.now() + selectedPool * 24 * 60 * 60 * 1000).toISOString(),
        claimed: false,
        earnings: earnings
    };
    
    stakes.push(stake);
    localStorage.setItem('pocketchain_stakes', JSON.stringify(stakes));
    
    recordTransaction('Stake', -amount, 'Locked');
    
    input.value = '';
    const earnPreview = document.getElementById('earnPreviewPro');
    if (earnPreview) earnPreview.style.display = 'none';
    
    document.querySelectorAll('.staking-pool').forEach(p => p.classList.remove('selected'));
    selectedPool = null;
    selectedAPY = 0;
    
    const btn = document.getElementById('stakeBtnPro');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Select a Pool to Stake';
    }
    
    const errorEl = document.getElementById('stakeError');
    if (errorEl) errorEl.classList.remove('show');
    
    updateActivePositions();
    showToast('Success', `Staked ${amount} PCH at ${selectedAPY}% APY`);
}

function updateActivePositions() {
    const container = document.getElementById('activePositions');
    if (!container) return;
    
    if (stakes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coins"></i>
                <p>No active stakes</p>
                <p class="empty-sub">Select a pool and start earning</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = stakes.map(stake => {
        const now = new Date().getTime();
        const unlock = new Date(stake.unlockDate).getTime();
        const isUnlocked = now >= unlock;
        const status = stake.claimed ? 'Claimed' : (isUnlocked ? 'Ready' : 'Staking');
        const statusClass = stake.claimed ? 'claimed' : (isUnlocked ? 'ready' : 'staking');
        const totalReturn = (stake.amount + stake.earnings).toFixed(2);
        
        return `
            <div class="position-card">
                <div class="position-header">
                    <div class="position-info">
                        <div class="position-amount">${stake.amount.toFixed(2)} PCH</div>
                        <div class="position-meta">${stake.apy}% APY • ${stake.period} days</div>
                    </div>
                    <span class="position-status ${statusClass}">${status}</span>
                </div>
                <div class="position-footer">
                    <div class="position-date">
                        ${isUnlocked ? 'Unlocked' : 'Unlocks ' + new Date(stake.unlockDate).toLocaleDateString()}
                    </div>
                    ${isUnlocked && !stake.claimed ? 
                        `<button class="btn-claim" onclick="claimStake(${stake.id})">Claim ${totalReturn} PCH</button>` :
                        `<button class="btn-claim" disabled>${stake.claimed ? 'Claimed' : 'Locked'}</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function claimStake(stakeId) {
    const idx = stakes.findIndex(s => s.id === stakeId);
    if (idx === -1) return;
    
    const stake = stakes[idx];
    if (stake.claimed) return;
    
    const totalReturn = stake.amount + stake.earnings;
    walletBalance += totalReturn;
    updateWalletDisplays();
    
    stakes[idx].claimed = true;
    localStorage.setItem('pocketchain_stakes', JSON.stringify(stakes));
    
    recordTransaction('Claim', totalReturn, 'Completed');
    
    updateActivePositions();
    updateAssetPage();
    showToast('Claimed!', `Received ${totalReturn.toFixed(2)} PCH`);
}

// --- AIRDROP ---
function updateAirdropPage() {
    const total = completedTasks.length * 10;
    const airdropTotal = document.getElementById('airdropTotal');
    if (airdropTotal) airdropTotal.textContent = total + ' PCH';
    
    completedTasks.forEach(task => {
        const btn = document.getElementById('task-' + task);
        if (btn) {
            btn.textContent = 'Claimed';
            btn.disabled = true;
        }
    });
    
    updateAttendanceUI();
    updateReferralUI();
}

function completeTask(task) {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    if (completedTasks.includes(task)) return;
    
    const urls = {
        'discord': 'https://discord.com',
        'telegram': 'https://telegram.org',
        'twitter': 'https://twitter.com'
    };
    
    window.open(urls[task], '_blank');
    
    const btn = document.getElementById('task-' + task);
    if (btn) {
        btn.textContent = 'Verifying...';
        btn.disabled = true;
    }
    
    setTimeout(() => {
        completedTasks.push(task);
        localStorage.setItem('pocketchain_tasks', JSON.stringify(completedTasks));
        
        walletBalance += 10;
        updateWalletDisplays();
        
        recordTransaction('Airdrop', 10, 'Completed');
        
        updateAirdropPage();
        showToast('Reward Claimed!', '+10 PCH added to your balance');
    }, 2000);
}

// --- ACCOUNT PAGE ---
function updateAccountInfo() {
    if (!currentUser) return;
    
    const accountFullName = document.getElementById('accountFullName');
    const accountEmail = document.getElementById('accountEmail');
    const accountUsername = document.getElementById('accountUsername');
    const accountAge = document.getElementById('accountAge');
    const accountJoined = document.getElementById('accountJoined');
    const accountWallet = document.getElementById('accountWallet');
    
    if (accountFullName) accountFullName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    if (accountEmail) accountEmail.textContent = currentUser.email;
    if (accountUsername) accountUsername.textContent = currentUser.username || currentUser.email.split('@')[0];
    if (accountAge) accountAge.textContent = currentUser.age;
    if (accountJoined) accountJoined.textContent = new Date(currentUser.createdAt).toLocaleDateString();
    if (accountWallet) accountWallet.textContent = walletConnected ? 
        walletAddress.substring(0, 10) + '...' + walletAddress.substring(34) : 'Not connected';
    
    // Update KYC status if system exists
    if (typeof kycSystem !== 'undefined' && kycSystem) {
        kycSystem.updateKYCStatus();
    }
}

// --- AUTH MODALS ---
function openAuthModal(type) {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        switchAuth(type);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
    
    const loginError = document.getElementById('loginError');
    const signupError = document.getElementById('signupError');
    if (loginError) loginError.classList.remove('show');
    if (signupError) signupError.classList.remove('show');
    
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
}

function switchAuth(type) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (!loginForm || !signupForm) return;
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input || !btn) return;
    
    const icon = btn.querySelector('i');
    if (!icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function handleLogin() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const errorDiv = document.getElementById('loginError');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        if (errorDiv) {
            errorDiv.textContent = 'Please fill in all fields';
            errorDiv.classList.add('show');
        }
        return;
    }
    
    // Check admin credentials
    if (email === ADMIN_CREDENTIALS.user && password === ADMIN_CREDENTIALS.pass) {
        const adminUser = {
            id: 999999,
            firstName: 'Master',
            lastName: 'Ghed',
            email: 'masterghed@pocketchain.network',
            age: 25,
            username: 'Masterghed',
            createdAt: new Date().toISOString(),
            isAdmin: true
        };
        
        currentUser = adminUser;
        localStorage.setItem('pocketchain_currentUser', JSON.stringify(adminUser));
        closeAuthModal();
        showPrivateUI();
        showToast('Welcome Back', 'Hello, Master Ghed! (Admin)');
        return;
    }
    
    // Check regular users - STRICT COMPARISON
    const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
    
    if (!user) {
        if (errorDiv) {
            errorDiv.textContent = 'Invalid email/username or password';
            errorDiv.classList.add('show');
        }
        return;
    }
    
    // Ensure user data is isolated
    currentUser = user;
    localStorage.setItem('pocketchain_currentUser', JSON.stringify(user));
    closeAuthModal();
    showPrivateUI();
    showToast('Welcome Back', `Hello, ${user.firstName}!`);
}

function handleSignup() {
    const regFirstName = document.getElementById('regFirstName');
    const regLastName = document.getElementById('regLastName');
    const regEmail = document.getElementById('regEmail');
    const regAge = document.getElementById('regAge');
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');
    const errorDiv = document.getElementById('signupError');
    
    if (!regFirstName || !regLastName || !regEmail || !regAge || !regPassword || !regConfirmPassword) return;
    
    const firstName = regFirstName.value.trim();
    const lastName = regLastName.value.trim();
    const email = regEmail.value.trim();
    const age = parseInt(regAge.value);
    const password = regPassword.value;
    const confirmPassword = regConfirmPassword.value;
    
    if (!firstName || !lastName || !email || !age || !password || !confirmPassword) {
        if (errorDiv) {
            errorDiv.textContent = 'Please fill in all fields';
            errorDiv.classList.add('show');
        }
        return;
    }
    
    if (age < 18) {
        if (errorDiv) {
            errorDiv.textContent = 'You must be 18 or older';
            errorDiv.classList.add('show');
        }
        return;
    }
    
    if (password.length < 8) {
        if (errorDiv) {
            errorDiv.textContent = 'Password must be at least 8 characters';
            errorDiv.classList.add('show');
        }
        return;
    }
    
    if (password !== confirmPassword) {
        if (errorDiv) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.add('show');
        }
        return;
    }
    
    // Check if email exists
    if (users.find(u => u.email === email)) {
        if (errorDiv) {
            errorDiv.textContent = 'Email already registered';
            errorDiv.classList.add('show');
        }
        return;
    }
    
    // Check if username exists
    const username = email.split('@')[0];
    if (users.find(u => u.username === username)) {
        if (errorDiv) {
            errorDiv.textContent = 'Username already taken';
            errorDiv.classList.add('show');
        }
        return;
    }
    
    const newUser = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        age,
        password,
        username: username,
        createdAt: new Date().toISOString(),
        isAdmin: false
    };
    
    users.push(newUser);
    localStorage.setItem('pocketchain_users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('pocketchain_currentUser', JSON.stringify(newUser));
    closeAuthModal();
    showPrivateUI();
    showToast('Welcome!', 'Account created successfully');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('pocketchain_currentUser');
    showPublicUI();
    showToast('Logged Out', 'See you soon!');
}

// --- SUPPORT ---
function submitSupport() {
    const supportSubject = document.getElementById('supportSubject');
    const supportMessage = document.getElementById('supportMessage');
    
    if (!supportSubject || !supportMessage) return;
    
    const subject = supportSubject.value.trim();
    const message = supportMessage.value.trim();
    
    if (!subject || !message) {
        showToast('Error', 'Please fill in all fields', 'error');
        return;
    }
    
    showToast('Ticket Submitted', "We'll respond within 24 hours");
    supportSubject.value = '';
    supportMessage.value = '';
}

function openBugModal() {
    const modal = document.getElementById('bugModal');
    if (modal) modal.classList.add('active');
}

function closeBugModal() {
    const modal = document.getElementById('bugModal');
    if (modal) modal.classList.remove('active');
}

function submitBug() {
    const bugType = document.getElementById('bugType');
    const bugDesc = document.getElementById('bugDesc');
    
    if (!bugDesc) return;
    
    const desc = bugDesc.value.trim();
    
    if (!desc) {
        showToast('Error', 'Please describe the issue', 'error');
        return;
    }
    
    showToast('Bug Reported', 'Thank you for your feedback');
    closeBugModal();
    bugDesc.value = '';
}

// --- CHARTS ---
let tokenomicsChartInstance = null;
let priceChartInstance = null;

function initCharts() {
    if (document.getElementById('tokenomicsChart')) {
        initTokenomicsChart();
    }
}

function initTokenomicsChart() {
    const ctx = document.getElementById('tokenomicsChart');
    if (!ctx) return;
    
    if (tokenomicsChartInstance) {
        tokenomicsChartInstance.destroy();
    }
    
    tokenomicsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Staking Rewards', 'Liquidity', 'Team', 'Development', 'Community/Airdrop', 'Reserve'],
            datasets: [{
                data: [40, 20, 15, 10, 10, 5],
                backgroundColor: [
                    '#00c2ff',
                    '#00ff88',
                    '#7000ff',
                    '#ffa502',
                    '#ff4757',
                    '#747d8c'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { 
                        color: '#8b9bb4', 
                        font: { size: 11 },
                        padding: 15,
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function initPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;
    
    if (priceChartInstance) {
        priceChartInstance.destroy();
    }
    
    const hours = 24;
    const labels = Array(hours).fill(0).map((_, i) => {
        const d = new Date();
        d.setHours(d.getHours() - (hours - i));
        return d.getHours() + ':00';
    });
    
    const basePrice = 0.045;
    const prices = Array(hours).fill(0).map(() => {
        return basePrice + (Math.random() - 0.5) * 0.01;
    });
    
    priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'PCH/USD',
                data: prices,
                borderColor: '#00c2ff',
                backgroundColor: 'rgba(0,194,255,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return 'PCH: $' + context.parsed.y.toFixed(4);
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#8b9bb4',
                        callback: function(value) {
                            return '$' + value.toFixed(3);
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: '#8b9bb4',
                        maxTicksLimit: 8
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// --- LIVE PRICE UPDATES ---
function startPriceUpdates() {
    setInterval(() => {
        const basePrice = 0.045;
        const price = (basePrice + (Math.random() - 0.5) * 0.005).toFixed(4);
        const change = (Math.random() * 8 - 2).toFixed(2);
        const volume = (2 + Math.random() * 1.5).toFixed(1);
        const marketCap = (parseFloat(price) * 1000000000).toFixed(2);
        
        const priceEl = document.getElementById('magPrice');
        if (priceEl) {
            priceEl.textContent = '$' + price;
            const changeEl = priceEl.nextElementSibling;
            if (changeEl) {
                changeEl.textContent = (change > 0 ? '+' : '') + change + '%';
                changeEl.style.background = change > 0 ? 'rgba(0,255,136,0.15)' : 'rgba(255,71,87,0.15)';
                changeEl.style.color = change > 0 ? 'var(--secondary)' : 'var(--danger)';
            }
        }
        
        const volEl = document.getElementById('magVolume');
        if (volEl) volEl.textContent = '$' + volume + 'M';
        
        const capEl = document.getElementById('magMarketCap');
        if (capEl) capEl.textContent = '$' + marketCap + 'B';
        
    }, 5000);
}

// --- UTILITIES ---
function recordTransaction(type, amount, status) {
    transactions.unshift({
        type: type,
        amount: amount,
        date: new Date().toISOString(),
        status: status
    });
    localStorage.setItem('pocketchain_transactions', JSON.stringify(transactions));
}

function updateAllStats() {
    updateWalletDisplays();
}

function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    const titleEl = document.getElementById('toastTitle');
    const messageEl = document.getElementById('toastMessage');
    const iconEl = toast.querySelector('.toast-icon');
    
    if (!toast || !titleEl || !messageEl || !iconEl) return;
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    iconEl.className = 'fas toast-icon ' + (type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle');
    iconEl.style.color = type === 'error' ? 'var(--danger)' : 'var(--secondary)';
    
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

console.log('🔷 PocketChain (PCH) Platform Loaded');
console.log('✨ Professional DeFi Platform with KYC, Referral & Attendance System');
