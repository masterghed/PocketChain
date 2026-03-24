// ==========================================
// POCKETCHAIN (PCH) - PROFESSIONAL DEFI PLATFORM
// FIXED JavaScript - All buttons working
// ==========================================

// --- STATE MANAGEMENT ---
let currentUser = null;
let walletConnected = false;
let walletAddress = null;
let walletBalance = 10000;
let selectedPool = null;
let selectedAPY = 0;
let selectedPeriod = 0;

// Data Storage
let stakes = JSON.parse(localStorage.getItem('pocketchain_stakes') || '[]');
let users = JSON.parse(localStorage.getItem('pocketchain_users') || '[]');
let completedTasks = JSON.parse(localStorage.getItem('pocketchain_tasks') || '[]');
let transactions = JSON.parse(localStorage.getItem('pocketchain_transactions') || '[]');

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
    decimals: 18
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔷 PocketChain Platform Loading...');
    
    checkAuthState();
    initCharts();
    updateAllStats();
    startPriceUpdates();
    setupEventListeners();
    
    // Ensure menu is closed on load
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    
    console.log('✅ Platform loaded successfully');
});

function setupEventListeners() {
    // Stake amount input listener
    const stakeInput = document.getElementById('stakeAmountPro');
    if (stakeInput) {
        stakeInput.addEventListener('input', calculateProEarnings);
    }
    
    // Close modals on outside click
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') && event.target.classList.contains('active')) {
            // Only close if clicking the background, not the content
            if (event.target === event.target.closest('.modal')) {
                closeAllModals();
            }
        }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllModals();
            // Also close menu
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
}

function showPrivateUI() {
    // Hide public menu items
    const publicMenu = document.getElementById('publicMenu');
    const loginMenu = document.getElementById('loginMenu');
    const privateMenu = document.getElementById('privateMenu');
    const accountMenu = document.getElementById('accountMenu');
    
    if (publicMenu) publicMenu.classList.add('hidden');
    if (loginMenu) loginMenu.classList.add('hidden');
    
    // Show private menu items
    if (privateMenu) privateMenu.classList.remove('hidden');
    if (accountMenu) accountMenu.classList.remove('hidden');
    
    // Update account info
    updateAccountInfo();
    
    // Show asset page by default if logged in
    showPage('asset');
}

function showPublicUI() {
    // Show public menu
    const publicMenu = document.getElementById('publicMenu');
    const loginMenu = document.getElementById('loginMenu');
    const privateMenu = document.getElementById('privateMenu');
    const accountMenu = document.getElementById('accountMenu');
    
    if (publicMenu) publicMenu.classList.remove('hidden');
    if (loginMenu) loginMenu.classList.remove('hidden');
    
    // Hide private menu
    if (privateMenu) privateMenu.classList.add('hidden');
    if (accountMenu) accountMenu.classList.add('hidden');
    
    // Reset to home
    showPage('home');
}

// --- MENU & NAVIGATION ---
function toggleMenu() {
    console.log('Toggle menu called');
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    
    if (!menu) {
        console.error('Menu element not found');
        return;
    }
    
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
    
    console.log('Menu state:', isOpen ? 'closed' : 'opened');
}

function showPage(pageId) {
    console.log('Showing page:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#sideMenu a').forEach(a => a.classList.remove('active'));
    
    // Show selected page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
        console.log('Page activated:', pageId);
    } else {
        console.error('Page not found:', pageId);
        return;
    }
    
    // Update menu active state
    const navMap = {
        'home': 'nav-home',
        'tokenomics': 'nav-tokenomics',
        'asset': 'nav-asset',
        'staking': 'nav-staking',
        'market': 'nav-market',
        'airdrop': 'nav-airdrop',
        'account': 'nav-account'
    };
    
    // Remove active from all nav items
    Object.values(navMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    
    // Add active to current
    if (navMap[pageId]) {
        const navEl = document.getElementById(navMap[pageId]);
        if (navEl) navEl.classList.add('active');
    }
    
    // Close menu if open
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('open')) {
        toggleMenu();
    }
    
    // Page specific updates
    if (pageId === 'asset') updateAssetPage();
    if (pageId === 'staking') updateStakingPage();
    if (pageId === 'market') initPriceChart();
    if (pageId === 'airdrop') updateAirdropPage();
    if (pageId === 'account') updateAccountInfo();
    if (pageId === 'tokenomics') initTokenomicsChart();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// --- WALLET FUNCTIONS ---
function openWalletModal() {
    console.log('Opening wallet modal');
    if (walletConnected) {
        disconnectWallet();
    } else {
        const modal = document.getElementById('walletModal');
        if (modal) {
            modal.classList.add('active');
            console.log('Wallet modal opened');
        }
    }
}

function closeWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) modal.classList.remove('active');
}

function connectWallet(type) {
    console.log('Connecting wallet:', type);
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
    
    const rate = 0.045;
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
}

// --- AUTH MODALS ---
function openAuthModal(type) {
    console.log('Opening auth modal:', type);
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
            createdAt: new Date().toISOString()
        };
        
        currentUser = adminUser;
        localStorage.setItem('pocketchain_currentUser', JSON.stringify(adminUser));
        closeAuthModal();
        showPrivateUI();
        showToast('Welcome Back', 'Hello, Master Ghed! (Admin)');
        return;
    }
    
    // Check regular users
    const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
    
    if (!user) {
        if (errorDiv) {
            errorDiv.textContent = 'Invalid email/username or password';
            errorDiv.classList.add('show');
        }
        return;
    }
    
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
    
    if (users.find(u => u.email === email)) {
        if (errorDiv) {
            errorDiv.textContent = 'Email already registered';
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
        username: email.split('@')[0],
        createdAt: new Date().toISOString()
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

// Add CSS styles for dynamic elements
const style = document.createElement('style');
style.textContent = `
    .tx-row {
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: var(--glass);
        border-radius: 10px;
        margin-bottom: 8px;
        border: 1px solid var(--border);
        align-items: center;
    }
    .tx-info { display: flex; flex-direction: column; }
    .tx-type { font-weight: 600; font-size: 0.9rem; }
    .tx-date { color: var(--text-muted); font-size: 0.75rem; }
    .tx-amount-section { text-align: right; }
    .tx-amount { font-weight: 700; font-size: 0.95rem; }
    .tx-amount.positive { color: var(--secondary); }
    .tx-amount.negative { color: #fff; }
    .tx-status { color: var(--text-muted); font-size: 0.75rem; }
    
    .position-card {
        background: var(--glass);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 10px;
    }
    .position-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    .position-amount { font-weight: 700; font-size: 1rem; }
    .position-meta { color: var(--text-muted); font-size: 0.8rem; }
    .position-status {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .position-status.staking { background: rgba(0,194,255,0.15); color: var(--primary); }
    .position-status.ready { background: rgba(0,255,136,0.15); color: var(--secondary); }
    .position-status.claimed { background: rgba(116,125,140,0.15); color: var(--text-muted); }
    .position-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .position-date { color: var(--text-muted); font-size: 0.8rem; }
    .btn-claim {
        background: var(--secondary);
        color: #000;
        border: none;
        padding: 6px 14px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        transition: 0.3s;
    }
    .btn-claim:hover:not(:disabled) { transform: scale(1.05); }
    .btn-claim:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

console.log('🔷 PocketChain (PCH) Platform Loaded');
console.log('📊 Total Supply: 1,000,000,000 PCH');
console.log('✨ All buttons and interactions are now working!');
