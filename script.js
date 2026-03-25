// ==========================================
// POCKETCHAIN - COMPLETE JAVASCRIPT
// WITH ALL MODIFICATIONS
// ==========================================

// --- STATE MANAGEMENT ---
let currentUser = null;
let walletConnected = false;
let walletAddress = null;
let walletType = null;
let walletBalance = 10000;
let selectedPool = null;
let selectedAPY = 0;
let selectedPeriod = 0;
let isDarkMode = localStorage.getItem('pocketchain_darkmode') !== 'false';
let currentChain = 'onchain';
let convertDirection = 'pchToCrypto';

// Data Storage with User Isolation
function getUserStorageKey(key) {
    if (!currentUser) return `pocketchain_${key}`;
    return `pocketchain_${key}_user${currentUser.id}`;
}

// Initialize user data
function initUserData() {
    if (!currentUser) return;
    
    const keys = ['onchain_balance', 'offchain_balance', 'stakes', 'tasks', 'transactions', 'attendance', 'referrals'];
    keys.forEach(key => {
        const userKey = getUserStorageKey(key);
        if (localStorage.getItem(userKey) === null) {
            localStorage.setItem(userKey, JSON.stringify(key === 'onchain_balance' || key === 'offchain_balance' ? 10000 : []));
        }
    });
}

// Get user-specific data
function getUserData(key) {
    const userKey = getUserStorageKey(key);
    const data = localStorage.getItem(userKey);
    return data ? JSON.parse(data) : (key.includes('balance') ? 10000 : []);
}

// Set user-specific data
function setUserData(key, value) {
    const userKey = getUserStorageKey(key);
    localStorage.setItem(userKey, JSON.stringify(value));
}

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

// Conversion rates
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
    
    if (currentUser) {
        initUserData();
        loadChainData();
    }
    
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

// --- DATE SYNC ---
function initDateSync() {
    const daySelect = document.getElementById('regDay');
    const monthSelect = document.getElementById('regMonth');
    const yearSelect = document.getElementById('regYear');
    const ageInput = document.getElementById('regAge');
    
    if (!daySelect || !monthSelect || !yearSelect || !ageInput) return;
    
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    months.forEach((month, idx) => {
        const option = document.createElement('option');
        option.value = idx + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 18; i >= currentYear - 100; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
    
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

// --- CHAIN TOGGLE SYSTEM ---
function switchChain(chain) {
    currentChain = chain;
    
    document.getElementById('onchainBtn').classList.toggle('active', chain === 'onchain');
    document.getElementById('offchainBtn').classList.toggle('active', chain === 'offchain');
    
    loadChainData();
    showToast('Switched', `Now viewing ${chain} assets`);
}

function loadChainData() {
    if (!currentUser) return;
    
    const balance = getUserData(`${currentChain}_balance`);
    document.getElementById('availableBalance').textContent = balance.toFixed(2) + ' PCH';
    updateTotalBalance();
    updateTransactionHistory();
}

function updateTotalBalance() {
    if (!currentUser) return;
    
    const onchain = getUserData('onchain_balance');
    const offchain = getUserData('offchain_balance');
    const stakes = getUserData('stakes');
    const staked = stakes.filter(s => !s.claimed).reduce((sum, s) => sum + s.amount, 0);
    const rewards = stakes.filter(s => !s.claimed).reduce((sum, s) => sum + s.earnings, 0);
    
    const total = onchain + offchain + staked + rewards;
    document.getElementById('totalBalance').textContent = total.toFixed(2) + ' PCH';
    document.getElementById('stakedBalance').textContent = staked.toFixed(2) + ' PCH';
    document.getElementById('rewardsBalance').textContent = rewards.toFixed(2) + ' PCH';
    
    const rate = TOKEN_CONFIG.price;
    const assetSub = document.querySelector('.asset-sub');
    if (assetSub) assetSub.textContent = `≈ $${(total * rate).toFixed(2)} USD`;
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
    let referrals = getUserData('referrals');
    if (!referrals.code) {
        referrals = {
            code: generateReferralCode(),
            invited: [],
            rewards: 0,
            createdAt: new Date().toISOString()
        };
        setUserData('referrals', referrals);
    }
    return referrals.code;
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
    const referrals = getUserData('referrals');
    
    const codeDisplay = document.getElementById('referralCodeDisplay');
    const invitedCount = document.getElementById('invitedCount');
    const referralRewards = document.getElementById('referralRewards');
    const inviteList = document.getElementById('inviteList');
    
    if (codeDisplay) codeDisplay.textContent = code;
    if (invitedCount) invitedCount.textContent = referrals.invited.length;
    if (referralRewards) referralRewards.textContent = `${referrals.rewards} PCH`;
    
    if (inviteList) {
        if (referrals.invited.length === 0) {
            inviteList.innerHTML = '<p class="empty-invites">No invites yet. Share your code!</p>';
        } else {
            inviteList.innerHTML = referrals.invited.map(inv => `
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
    let attendance = getUserData('attendance');
    
    if (!attendance.lastClaim) {
        attendance = {
            lastClaim: null,
            streak: 0,
            totalClaims: 0,
            history: []
        };
    }
    
    const lastClaim = attendance.lastClaim ? new Date(attendance.lastClaim) : null;
    
    if (!lastClaim || new Date().toDateString() !== lastClaim.toDateString()) {
        const claimBtn = document.getElementById('dailyClaimBtn');
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.textContent = 'Claim Daily Reward';
            claimBtn.classList.remove('claimed');
        }
    } else {
        const claimBtn = document.getElementById('dailyClaimBtn');
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Already Claimed Today';
            claimBtn.classList.add('claimed');
        }
    }
    
    setUserData('attendance', attendance);
}

function claimDailyReward() {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    const today = new Date().toDateString();
    let attendance = getUserData('attendance');
    
    if (attendance.lastClaim && new Date(attendance.lastClaim).toDateString() === today) {
        showToast('Error', 'Already claimed today', 'error');
        return;
    }
    
    if (attendance.lastClaim) {
        const lastClaim = new Date(attendance.lastClaim);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastClaim.toDateString() !== yesterday.toDateString()) {
            attendance.streak = 0;
        }
    }
    
    attendance.streak++;
    attendance.lastClaim = new Date().toISOString();
    attendance.totalClaims++;
    attendance.history.push({
        date: new Date().toISOString(),
        reward: 1,
        streak: attendance.streak
    });
    
    setUserData('attendance', attendance);
    
    let reward = 1;
    let bonus = 0;
    
    if (attendance.streak % 7 === 0) {
        bonus = 5;
        reward += bonus;
        showToast('Streak Bonus!', `7-day streak! +${bonus} PCH bonus!`, 'success');
    }
    
    const balance = getUserData(`${currentChain}_balance`);
    setUserData(`${currentChain}_balance`, balance + reward);
    
    recordTransaction('Daily Claim', reward, 'Completed');
    
    updateAttendanceUI();
    checkDailyAttendance();
    loadChainData();
    
    const bonusMsg = bonus > 0 ? ` (+${bonus} bonus)` : '';
    showToast('Claimed!', `+${reward} PCH${bonusMsg}`, 'success');
}

function updateAttendanceUI() {
    if (!currentUser) return;
    
    const attendance = getUserData('attendance');
    
    const streakDisplay = document.getElementById('attendanceStreak');
    const totalClaims = document.getElementById('totalClaims');
    const nextBonus = document.getElementById('nextBonus');
    
    if (streakDisplay) streakDisplay.textContent = attendance.streak || 0;
    if (totalClaims) totalClaims.textContent = attendance.totalClaims || 0;
    
    if (nextBonus) {
        const streak = attendance.streak || 0;
        const daysUntilBonus = 7 - (streak % 7);
        nextBonus.textContent = daysUntilBonus === 7 ? 'Bonus Ready!' : `${daysUntilBonus} days`;
    }
}

// --- WALLET FUNCTIONS ---
function openWalletModal() {
    if (walletConnected) {
        disconnectWallet();
    } else {
        const modal = document.getElementById('walletModal');
        if (modal) modal.classList.add('active');
    }
}

function closeWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) modal.classList.remove('active');
}

function connectWallet(type) {
    walletConnected = true;
    walletType = type;
    walletAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    updateWalletButton();
    
    if (window.onWalletConnected) {
        window.onWalletConnected();
        window.onWalletConnected = null;
    }
    
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
    walletType = null;
    
    updateWalletButton();
    
    if (!silent) showToast('Disconnected', 'Wallet disconnected');
}

// --- SEND/RECEIVE ---
function openSendModal() {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    const modal = document.getElementById('sendModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('sendChainBadge').textContent = currentChain === 'onchain' ? 'Onchain' : 'Offchain';
        
        const balance = getUserData(`${currentChain}_balance`);
        document.getElementById('sendAvailableBalance').textContent = balance.toFixed(2);
    }
}

function closeSendModal() {
    const modal = document.getElementById('sendModal');
    if (modal) modal.classList.remove('active');
    
    document.getElementById('sendAddress').value = '';
    document.getElementById('sendAmount').value = '';
}

function executeSend() {
    const address = document.getElementById('sendAddress').value.trim();
    const amount = parseFloat(document.getElementById('sendAmount').value);
    
    if (!address || !amount || amount <= 0) {
        showToast('Error', 'Invalid input', 'error');
        return;
    }
    
    const balance = getUserData(`${currentChain}_balance`);
    if (amount > balance) {
        showToast('Error', 'Insufficient balance', 'error');
        return;
    }
    
    setUserData(`${currentChain}_balance`, balance - amount);
    recordTransaction(`Send (${currentChain})`, -amount, 'Completed');
    
    loadChainData();
    closeSendModal();
    showToast('Success', `Sent ${amount} PCH on ${currentChain}`);
}

function openReceiveModal() {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    const modal = document.getElementById('receiveModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('receiveChainBadge').textContent = currentChain === 'onchain' ? 'Onchain' : 'Offchain';
        
        const address = generateUserAddress();
        document.getElementById('receiveAddress').value = address;
        document.getElementById('receiveQR').textContent = address.substring(0, 20) + '...';
    }
}

function closeReceiveModal() {
    const modal = document.getElementById('receiveModal');
    if (modal) modal.classList.remove('active');
}

function generateUserAddress() {
    if (!currentUser) return 'Not connected';
    const base = currentChain === 'onchain' ? '0x' : 'off';
    const hash = (currentUser.id * 9999).toString(16).substring(0, 8);
    return `${base}${hash}...${currentUser.email.substring(0, 4)}`;
}

function copyAddress() {
    const address = document.getElementById('receiveAddress').value;
    if (!address || address === 'Not connected') return;
    
    navigator.clipboard.writeText(address).then(() => {
        showToast('Copied', 'Address copied to clipboard');
    });
}

// --- BIDIRECTIONAL CONVERT ---
function openConvertModal() {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
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

function setConvertDirection(direction) {
    convertDirection = direction;
    
    document.getElementById('pchToCryptoBtn').classList.toggle('active', direction === 'pchToCrypto');
    document.getElementById('cryptoToPchBtn').classList.toggle('active', direction === 'cryptoToPch');
    
    const fromLabel = document.getElementById('convertFromLabel');
    const toLabel = document.getElementById('convertToLabel');
    
    if (direction === 'pchToCrypto') {
        fromLabel.textContent = 'From (PCH)';
        toLabel.textContent = 'To';
    } else {
        fromLabel.textContent = 'From';
        toLabel.textContent = 'To (PCH)';
    }
    
    updateConvertRates();
}

function swapConvertDirection() {
    setConvertDirection(convertDirection === 'pchToCrypto' ? 'cryptoToPch' : 'pchToCrypto');
}

function updateConvertRates() {
    const amount = parseFloat(document.getElementById('convertFromAmount').value) || 0;
    const currency = document.getElementById('convertToCurrency').value;
    
    if (amount <= 0) {
        document.getElementById('convertToAmount').textContent = '0.00';
        return;
    }
    
    const rate = CONVERSION_RATES[currency];
    let result;
    
    if (convertDirection === 'pchToCrypto') {
        result = (amount * rate).toFixed(currency === 'BTC' || currency === 'ETH' ? 8 : 2);
        document.getElementById('convertRateText').textContent = `Rate: 1 PCH = ${rate} ${currency}`;
    } else {
        result = (amount / rate).toFixed(2);
        document.getElementById('convertRateText').textContent = `Rate: 1 ${currency} = ${(1/rate).toFixed(2)} PCH`;
    }
    
    document.getElementById('convertToAmount').textContent = result + ' ' + (convertDirection === 'pchToCrypto' ? currency : 'PCH');
}

function executeConvert() {
    const amount = parseFloat(document.getElementById('convertFromAmount').value);
    const currency = document.getElementById('convertToCurrency').value;
    
    if (!amount || amount <= 0) {
        showToast('Error', 'Enter valid amount', 'error');
        return;
    }
    
    const balance = getUserData(`${currentChain}_balance`);
    
    if (convertDirection === 'pchToCrypto') {
        if (amount > balance) {
            showToast('Error', 'Insufficient PCH balance', 'error');
            return;
        }
        
        setUserData(`${currentChain}_balance`, balance - amount);
        const rate = CONVERSION_RATES[currency];
        const received = (amount * rate).toFixed(currency === 'BTC' || currency === 'ETH' ? 8 : 2);
        
        recordTransaction(`Convert PCH→${currency}`, -amount, 'Completed');
        showToast('Converted!', `${amount} PCH → ${received} ${currency}`);
    } else {
        const rate = CONVERSION_RATES[currency];
        const pchReceived = (amount / rate);
        
        setUserData(`${currentChain}_balance`, balance + pchReceived);
        recordTransaction(`Convert ${currency}→PCH`, pchReceived, 'Completed');
        showToast('Converted!', `${amount} ${currency} → ${pchReceived.toFixed(2)} PCH`);
    }
    
    loadChainData();
    closeConvertModal();
    document.getElementById('convertFromAmount').value = '';
    document.getElementById('convertToAmount').textContent = '0.00';
}

// --- WITHDRAW WITH WALLET INTEGRATION ---
function openWithdrawModal() {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.classList.add('active');
        updateWithdrawWalletStatus();
        
        const balance = getUserData(`${currentChain}_balance`);
        document.getElementById('withdrawAvailableBalance').textContent = balance.toFixed(2);
        
        document.getElementById('withdrawAmount').oninput = function() {
            const amt = parseFloat(this.value) || 0;
            document.getElementById('totalDeduction').textContent = (amt + 0.5).toFixed(2) + ' PCH';
        };
    }
}

function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) modal.classList.remove('active');
}

function updateWithdrawWalletStatus() {
    const statusBox = document.getElementById('withdrawWalletStatus');
    const submitBtn = document.getElementById('withdrawSubmitBtn');
    const addressInput = document.getElementById('withdrawAddress');
    
    if (walletConnected && walletAddress) {
        statusBox.innerHTML = `<i class="fas fa-check-circle" style="color: var(--secondary);"></i>
            <div class="wallet-status-text">
                <span>Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}</span>
                <button class="btn-secondary btn-small" onclick="disconnectWalletForWithdraw()">Disconnect</button>
            </div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Withdraw Now';
        addressInput.value = walletAddress;
    } else {
        statusBox.innerHTML = `<i class="fas fa-wallet"></i>
            <div class="wallet-status-text">
                <span>No wallet connected</span>
                <button class="btn-primary btn-small" onclick="connectWalletForWithdraw()">Connect Wallet</button>
            </div>`;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connect Wallet to Withdraw';
        addressInput.value = '';
    }
}

function connectWalletForWithdraw() {
    openWalletModal();
    window.onWalletConnected = function() {
        updateWithdrawWalletStatus();
    };
}

function disconnectWalletForWithdraw() {
    disconnectWallet();
    updateWithdrawWalletStatus();
}

function executeWithdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    if (!amount || amount <= 0) {
        showToast('Error', 'Enter valid amount', 'error');
        return;
    }
    
    const balance = getUserData(`${currentChain}_balance`);
    
    if (amount + 0.5 > balance) {
        showToast('Error', 'Insufficient balance (including fee)', 'error');
        return;
    }
    
    setUserData(`${currentChain}_balance`, balance - amount - 0.5);
    recordTransaction(`Withdraw to Wallet`, -(amount + 0.5), 'Completed');
    
    loadChainData();
    closeWithdrawModal();
    showToast('Withdrawal Initiated', `${amount} PCH sent to your wallet`);
}

// --- STAKING PRO ---
function updateStakingPage() {
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
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    const balance = getUserData(`${currentChain}_balance`);
    const input = document.getElementById('stakeAmountPro');
    if (input) {
        input.value = balance.toFixed(2);
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
            const balance = getUserData(`${currentChain}_balance`);
            if (amount > balance) {
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
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
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
    
    const balance = getUserData(`${currentChain}_balance`);
    if (amount > balance) {
        showToast('Error', 'Insufficient balance', 'error');
        return;
    }
    
    const minAmounts = { 7: 100, 180: 1000, 365: 5000, 1825: 10000 };
    if (amount < minAmounts[selectedPool]) {
        showToast('Error', `Minimum ${minAmounts[selectedPool]} PCH required`, 'error');
        return;
    }
    
    setUserData(`${currentChain}_balance`, balance - amount);
    
    const earnings = amount * (selectedAPY / 100) * (selectedPeriod / 365);
    const stakes = getUserData('stakes');
    const stake = {
        id: Date.now(),
        userId: currentUser.id,
        amount: amount,
        period: selectedPool,
        apy: selectedAPY,
        startDate: new Date().toISOString(),
        unlockDate: new Date(Date.now() + selectedPool * 24 * 60 * 60 * 1000).toISOString(),
        claimed: false,
        earnings: earnings
    };
    
    stakes.push(stake);
    setUserData('stakes', stakes);
    
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
    updateTotalBalance();
    showToast('Success', `Staked ${amount} PCH at ${selectedAPY}% APY`);
}

function updateActivePositions() {
    const container = document.getElementById('activePositions');
    if (!container || !currentUser) return;
    
    const stakes = getUserData('stakes');
    
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
    const stakes = getUserData('stakes');
    const idx = stakes.findIndex(s => s.id === stakeId);
    if (idx === -1) return;
    
    const stake = stakes[idx];
    if (stake.claimed) return;
    
    const totalReturn = stake.amount + stake.earnings;
    const balance = getUserData(`${currentChain}_balance`);
    setUserData(`${currentChain}_balance`, balance + totalReturn);
    
    stakes[idx].claimed = true;
    setUserData('stakes', stakes);
    
    recordTransaction('Claim', totalReturn, 'Completed');
    
    updateActivePositions();
    updateTotalBalance();
    showToast('Claimed!', `Received ${totalReturn.toFixed(2)} PCH`);
}

// --- AIRDROP & LEADERBOARD ---
function updateAirdropPage() {
    const tasks = getUserData('tasks');
    const total = tasks.length * 10;
    const airdropTotal = document.getElementById('airdropTotal');
    if (airdropTotal) airdropTotal.textContent = total + ' PCH';
    
    tasks.forEach(task => {
        const btn = document.getElementById('task-' + task);
        if (btn) {
            btn.textContent = 'Claimed';
            btn.disabled = true;
        }
    });
    
    updateAttendanceUI();
    updateReferralUI();
    loadLeaderboard('earners');
}

function switchLeaderboard(type) {
    document.querySelectorAll('.leaderboard-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    loadLeaderboard(type);
}

function loadLeaderboard(type) {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    
    let data = [
        { name: 'Alex M.', email: 'alex@email.com', amount: type === 'earners' ? 1250 : 45 },
        { name: 'Sarah K.', email: 'sarah@email.com', amount: type === 'earners' ? 980 : 38 },
        { name: 'Mike R.', email: 'mike@email.com', amount: type === 'earners' ? 875 : 32 },
        { name: 'Emma L.', email: 'emma@email.com', amount: type === 'earners' ? 720 : 28 },
        { name: 'John D.', email: 'john@email.com', amount: type === 'earners' ? 650 : 22 }
    ];
    
    if (currentUser) {
        const userEntry = data.find(d => d.email === currentUser.email);
        if (!userEntry) {
            const tasks = getUserData('tasks');
            const referrals = getUserData('referrals');
            data.push({
                name: `${currentUser.firstName} ${currentUser.lastName}`,
                email: currentUser.email,
                amount: type === 'earners' ? (tasks.length * 10) : (referrals.invited?.length || 0)
            });
        }
    }
    
    data.sort((a, b) => b.amount - a.amount);
    
    list.innerHTML = data.map((entry, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'normal';
        const isCurrentUser = currentUser && entry.email === currentUser.email;
        
        return `
            <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
                <div class="leaderboard-avatar">${entry.name.charAt(0)}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${entry.name} ${isCurrentUser ? '(You)' : ''}</div>
                    <div class="leaderboard-email">${entry.email}</div>
                </div>
                <div class="leaderboard-amount">${entry.amount} ${type === 'earners' ? 'PCH' : 'refs'}</div>
            </div>
        `;
    }).join('');
}

function completeTask(task) {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'error');
        return;
    }
    
    const tasks = getUserData('tasks');
    if (tasks.includes(task)) return;
    
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
        tasks.push(task);
        setUserData('tasks', tasks);
        
        const balance = getUserData(`${currentChain}_balance`);
        setUserData(`${currentChain}_balance`, balance + 10);
        
        recordTransaction('Airdrop', 10, 'Completed');
        
        updateAirdropPage();
        loadChainData();
        showToast('Reward Claimed!', '+10 PCH added to your balance');
    }, 2000);
}

// --- ACCOUNT PAGE ---
function updateAccountInfo() {
    if (!currentUser) return;
    
    document.getElementById('accountFullName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('accountEmail').textContent = currentUser.email;
    document.getElementById('accountUsername').textContent = currentUser.username || currentUser.email.split('@')[0];
    document.getElementById('accountAge').textContent = currentUser.age;
    document.getElementById('accountJoined').textContent = new Date(currentUser.createdAt).toLocaleDateString();
    document.getElementById('accountWallet').textContent = walletConnected ? 
        walletAddress.substring(0, 10) + '...' + walletAddress.substring(34) : 'Not connected';
}

// --- AUTHENTICATION ---
function checkAuthState() {
    const savedUser = localStorage.getItem('pocketchain_currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        initUserData();
        showPrivateUI();
    } else {
        showPublicUI();
    }
}

function showPrivateUI() {
    document.getElementById('publicMenu').classList.add('hidden');
    document.getElementById('loginMenu').classList.add('hidden');
    document.getElementById('privateMenu').classList.remove('hidden');
    document.getElementById('accountMenu').classList.remove('hidden');
    
    updateAccountInfo();
    updateAttendanceUI();
    updateReferralUI();
    initAttendanceSystem();
    
    showPage('asset');
}

function showPublicUI() {
    document.getElementById('publicMenu').classList.remove('hidden');
    document.getElementById('loginMenu').classList.remove('hidden');
    document.getElementById('privateMenu').classList.add('hidden');
    document.getElementById('accountMenu').classList.add('hidden');
    
    showPage('home');
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
    if (page) page.classList.add('active');
    
    const navMap = {
        'home': 'nav-home',
        'tokenomics': 'nav-tokenomics',
        'asset': 'nav-asset',
        'staking': 'nav-staking',
        'market': 'nav-market',
        'airdrop': 'nav-airdrop',
        'account': 'nav-account'
    };
    
    if (navMap[pageId]) {
        const navEl = document.getElementById(navMap[pageId]);
        if (navEl) navEl.classList.add('active');
    }
    
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('open')) toggleMenu();
    
    if (pageId === 'asset') loadChainData();
    if (pageId === 'staking') updateStakingPage();
    if (pageId === 'market') initPriceChart();
    if (pageId === 'airdrop') updateAirdropPage();
    if (pageId === 'account') updateAccountInfo();
    if (pageId === 'tokenomics') initTokenomicsChart();
    
    window.scrollTo(0, 0);
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
    
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('signupError').classList.remove('show');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
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
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.add('show');
        return;
    }
    
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
        initUserData();
        closeAuthModal();
        showPrivateUI();
        showToast('Welcome Back', 'Hello, Master Ghed! (Admin)');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('pocketchain_users') || '[]');
    const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
    
    if (!user) {
        errorDiv.textContent = 'Invalid email/username or password';
        errorDiv.classList.add('show');
        return;
    }
    
    currentUser = user;
    localStorage.setItem('pocketchain_currentUser', JSON.stringify(user));
    initUserData();
    closeAuthModal();
    showPrivateUI();
    showToast('Welcome Back', `Hello, ${user.firstName}!`);
}

function handleSignup() {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const age = parseInt(document.getElementById('regAge').value);
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorDiv = document.getElementById('signupError');
    
    if (!firstName || !lastName || !email || !age || !password || !confirmPassword) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.add('show');
        return;
    }
    
    if (age < 18) {
        errorDiv.textContent = 'You must be 18 or older';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password.length < 8) {
        errorDiv.textContent = 'Password must be at least 8 characters';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.add('show');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('pocketchain_users') || '[]');
    
    if (users.find(u => u.email === email)) {
        errorDiv.textContent = 'Email already registered';
        errorDiv.classList.add('show');
        return;
    }
    
    const username = email.split('@')[0];
    if (users.find(u => u.username === username)) {
        errorDiv.textContent = 'Username already taken';
        errorDiv.classList.add('show');
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
    initUserData();
    closeAuthModal();
    showPrivateUI();
    showToast('Welcome!', 'Account created successfully');
}

function logout() {
    if (walletConnected) {
        disconnectWallet(true);
    }
    
    currentUser = null;
    localStorage.removeItem('pocketchain_currentUser');
    showPublicUI();
    showToast('Logged Out', 'Wallet disconnected and session ended');
}

// --- SUPPORT ---
function submitSupport() {
    const subject = document.getElementById('supportSubject').value.trim();
    const message = document.getElementById('supportMessage').value.trim();
    
    if (!subject || !message) {
        showToast('Error', 'Please fill in all fields', 'error');
        return;
    }
    
    showToast('Ticket Submitted', "We'll respond within 24 hours");
    document.getElementById('supportSubject').value = '';
    document.getElementById('supportMessage').value = '';
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
    const desc = document.getElementById('bugDesc').value.trim();
    
    if (!desc) {
        showToast('Error', 'Please describe the issue', 'error');
        return;
    }
    
    showToast('Bug Reported', 'Thank you for your feedback');
    closeBugModal();
    document.getElementById('bugDesc').value = '';
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
    
    if (tokenomicsChartInstance) tokenomicsChartInstance.destroy();
    
    tokenomicsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Staking Rewards', 'Liquidity', 'Team', 'Development', 'Community/Airdrop', 'Reserve'],
            datasets: [{
                data: [40, 20, 15, 10, 10, 5],
                backgroundColor: ['#00c2ff', '#00ff88', '#7000ff', '#ffa502', '#ff4757', '#747d8c'],
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
                    labels: { color: '#8b9bb4', font: { size: 11 }, padding: 15, boxWidth: 12 }
                }
            },
            cutout: '65%'
        }
    });
}

function initPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;
    
    if (priceChartInstance) priceChartInstance.destroy();
    
    const hours = 24;
    const labels = Array(hours).fill(0).map((_, i) => {
        const d = new Date();
        d.setHours(d.getHours() - (hours - i));
        return d.getHours() + ':00';
    });
    
    const basePrice = 0.045;
    const prices = Array(hours).fill(0).map(() => basePrice + (Math.random() - 0.5) * 0.01);
    
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
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#8b9bb4', callback: function(value) { return '$' + value.toFixed(3); } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8b9bb4', maxTicksLimit: 8 }
                }
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
    const transactions = getUserData('transactions');
    transactions.unshift({
        type: type,
        amount: amount,
        date: new Date().toISOString(),
        status: status
    });
    setUserData('transactions', transactions);
    updateTransactionHistory();
}

function updateTransactionHistory() {
    const container = document.getElementById('transactionHistory');
    if (!container || !currentUser) return;
    
    const transactions = getUserData('transactions');
    
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

function updateAllStats() {
    if (currentUser) loadChainData();
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

function setupEventListeners() {
    const stakeInput = document.getElementById('stakeAmountPro');
    if (stakeInput) stakeInput.addEventListener('input', calculateProEarnings);
    
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') && event.target.classList.contains('active')) {
            if (event.target === event.target.closest('.modal')) {
                closeAllModals();
            }
        }
    });
    
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
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
}

console.log('🔷 PocketChain (PCH) Platform Loaded');
console.log('✨ Professional DeFi Platform with All Features');