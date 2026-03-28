// ==========================================
// POCKETCHAIN - FULL WORKING SCRIPT (STANDALONE)
// 100% Fixed Buttons, Modals, and Navigation
// ==========================================

// --- STATE MANAGEMENT ---
let isDarkMode = localStorage.getItem('pocketchain_darkmode') !== 'false';
let currentUser = null;
let balancePCH = 10000; // Default starting balance
let selectedAPY = 0;
let selectedPeriod = 0;

window.onload = () => {
    applyTheme(isDarkMode);
    initCharts();
    showPage('home');
    updateBalances();
};

// --- NAVIGATION & MENU ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    document.querySelectorAll('#sideMenu a').forEach(a => a.classList.remove('active'));
    const navItem = document.getElementById('nav-' + pageId);
    if(navItem) navItem.classList.add('active');

    window.scrollTo(0, 0);
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('open')) toggleMenu();
}

function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

// --- AUTHENTICATION (SIMULATED) ---
function handleLogin() {
    currentUser = { name: "User", email: document.getElementById('loginEmail').value };
    closeAuthModal();
    document.getElementById('loginMenu').classList.add('hidden');
    document.getElementById('privateMenu').classList.remove('hidden');
    document.getElementById('accountMenu').classList.remove('hidden');
    showToast('Success', 'Welcome back to PocketChain!');
    showPage('asset');
}

function handleSignup() {
    currentUser = { name: document.getElementById('regFirstName').value, email: document.getElementById('regEmail').value };
    closeAuthModal();
    document.getElementById('loginMenu').classList.add('hidden');
    document.getElementById('privateMenu').classList.remove('hidden');
    document.getElementById('accountMenu').classList.remove('hidden');
    showToast('Success', 'Account created! You received 10,000 PCH.');
    showPage('asset');
}

function logout() {
    currentUser = null;
    location.reload();
}

// --- MODALS (FIXED) ---
function openAuthModal(type) { 
    document.getElementById('authModal').classList.add('active'); 
    switchAuth(type); 
}
function closeAuthModal() { document.getElementById('authModal').classList.remove('active'); }

function switchAuth(type) {
    if (type === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
}

function openWalletModal() { document.getElementById('walletModal').classList.add('active'); }
function closeWalletModal() { document.getElementById('walletModal').classList.remove('active'); }

function connectWallet(type) {
    showToast('Success', type.toUpperCase() + ' Wallet Connected!');
    closeWalletModal();
    document.getElementById('walletBtn').innerHTML = '<i class="fas fa-wallet"></i><span>0x8F...3A2</span>';
    document.getElementById('walletBtn').classList.add('connected');
}

// --- PCH WALLET UNLOCK ---
function unlockWithPassphrase() { document.getElementById('passphraseModal').classList.add('active'); }
function closePassphraseModal() { document.getElementById('passphraseModal').classList.remove('active'); }
function confirmPassphraseUnlock() {
    closePassphraseModal();
    document.getElementById('unlockButtons').classList.add('hidden');
    document.getElementById('walletLockedState').classList.add('hidden');
    document.getElementById('walletContent').classList.remove('hidden');
    showToast('Success', 'Wallet Unlocked');
}
function unlockWithFingerprint() { confirmPassphraseUnlock(); }

// --- TRANSACTIONS & CONVERT MODALS ---
function openDepositModal() { document.getElementById('depositModal').classList.add('active'); }
function closeDepositModal() { document.getElementById('depositModal').classList.remove('active'); }
function copyDepositAddress() { showToast('Success', 'Address Copied!'); }

function openWithdrawOptionsModal() { document.getElementById('withdrawOptionsModal').classList.add('active'); }
function closeWithdrawOptionsModal() { document.getElementById('withdrawOptionsModal').classList.remove('active'); }

function openP2PModal() { closeWithdrawOptionsModal(); document.getElementById('p2pModal').classList.add('active'); }
function closeP2PModal() { document.getElementById('p2pModal').classList.remove('active'); }
function switchP2PTab(type) {
    document.querySelectorAll('.p2p-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
}
function calculateP2P() {
    const php = parseFloat(document.getElementById('p2pPhpAmount').value) || 0;
    document.getElementById('p2pPchAmount').value = (php / 2.50).toFixed(2);
}
function executeP2POrder() { showToast('Success', 'P2P Order placed successfully!'); closeP2PModal(); }

function openWithdrawCryptoModal() { closeWithdrawOptionsModal(); document.getElementById('withdrawCryptoModal').classList.add('active'); }
function closeWithdrawCryptoModal() { document.getElementById('withdrawCryptoModal').classList.remove('active'); }

function openSendModal() { document.getElementById('sendModal').classList.add('active'); }
function closeSendModal() { document.getElementById('sendModal').classList.remove('active'); }
function executeSend() { showToast('Success', 'Tokens Sent Successfully!'); closeSendModal(); }

function openConvertModal() { document.getElementById('convertModal').classList.add('active'); }
function closeConvertModal() { document.getElementById('convertModal').classList.remove('active'); }
function setConvertAmount(amount) { document.getElementById('convertFromAmount').value = amount; updateConvertRates(); }
function updateConvertRates() {
    const amount = parseFloat(document.getElementById('convertFromAmount').value) || 0;
    document.getElementById('convertToAmount').value = (amount * 0.045).toFixed(2);
    document.getElementById('convertReceiveAmount').textContent = (amount * 0.045).toFixed(2) + ' USDT';
}
function executeConvert() { showToast('Success', 'Converted Successfully!'); closeConvertModal(); }

// --- STAKING LOGIC ---
function selectPool(element, period, apy) {
    document.querySelectorAll('.staking-pool').forEach(p => p.classList.remove('selected'));
    element.classList.add('selected');
    selectedPeriod = period;
    selectedAPY = apy;
    const btn = document.getElementById('stakeBtnPro');
    btn.disabled = false;
    btn.textContent = `Stake Now (${apy}% APY)`;
    calculateProEarnings();
}

function calculateProEarnings() {
    const amount = parseFloat(document.getElementById('stakeAmountPro').value) || 0;
    const preview = document.getElementById('earnPreviewPro');
    if (amount > 0 && selectedAPY > 0) {
        const totalReward = (amount * (selectedAPY / 100) * (selectedPeriod / 365));
        const dailyReward = totalReward / selectedPeriod;
        document.getElementById('totalReturnPro').textContent = `+${totalReward.toFixed(2)} PCH`;
        document.getElementById('dailyEarningsPro').textContent = `+${dailyReward.toFixed(2)} PCH`;
        preview.classList.add('show');
    } else {
        preview.classList.remove('show');
    }
}

function setMaxStake() {
    document.getElementById('stakeAmountPro').value = balancePCH;
    calculateProEarnings();
}

function stakePro() {
    const amount = parseFloat(document.getElementById('stakeAmountPro').value) || 0;
    if (amount <= 0 || amount > balancePCH) {
        showToast('Error', 'Invalid amount or insufficient balance', 'error');
        return;
    }
    balancePCH -= amount;
    updateBalances();
    showToast('Success', 'Successfully staked ' + amount + ' PCH!');
    document.getElementById('stakeAmountPro').value = '';
    
    // Add to active stakes UI
    const container = document.getElementById('activePositions');
    container.innerHTML = `
        <div class="card" style="margin-bottom: 10px; border-left: 3px solid var(--secondary);">
            <div style="display:flex; justify-content:space-between;">
                <strong>${amount.toLocaleString()} PCH</strong>
                <span style="color:var(--secondary);">${selectedAPY}% APY</span>
            </div>
            <div style="font-size: 0.8rem; color:var(--text-muted); margin-top:5px;">
                Period: ${selectedPeriod} Days
            </div>
        </div>
    ` + (container.innerHTML.includes('empty-state') ? '' : container.innerHTML);
}

// --- UTILITIES & OTHERS ---
function updateBalances() {
    const elements = ['availableBalance', 'stakeBalanceDisplay', 'withdrawAvailableBalance', 'sendAvailableBalance', 'convertFromBalance'];
    elements.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).textContent = balancePCH.toLocaleString();
    });
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') { input.type = 'text'; icon.className = 'fas fa-eye-slash'; } 
    else { input.type = 'password'; icon.className = 'fas fa-eye'; }
}

function claimDailyReward() {
    balancePCH += 10;
    updateBalances();
    showToast('Success', 'Daily claimed! +10 PCH');
    document.getElementById('dailyClaimBtn').disabled = true;
}

function completeTask(platform) {
    balancePCH += 10;
    updateBalances();
    showToast('Success', `Task completed! +10 PCH`);
    const btn = document.getElementById(`task-${platform}`);
    btn.disabled = true; btn.textContent = 'Claimed'; btn.style.background = '#333';
}

function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    const icon = toast.querySelector('.toast-icon');
    icon.className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} toast-icon`;
    icon.style.color = type === 'success' ? 'var(--secondary)' : 'var(--danger)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleFaq(element) { element.parentElement.classList.toggle('active'); }
function switchLeaderboard(type) { document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active')); event.target.classList.add('active'); }
function copyReferralCode() { showToast('Success', 'Referral Code Copied!'); }
function openBugModal() { document.getElementById('bugModal').classList.add('active'); }
function closeBugModal() { document.getElementById('bugModal').classList.remove('active'); }
function submitBug() { showToast('Success', 'Bug reported!'); closeBugModal(); }
function submitSupport() { showToast('Success', 'Support ticket submitted!'); }

// --- THEME & CHARTS ---
function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('pocketchain_darkmode', isDarkMode);
    applyTheme(isDarkMode);
}

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.remove('light-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    } else {
        document.body.classList.add('light-mode');
        document.getElementById('themeIcon').className = 'fas fa-moon';
    }
    initCharts();
}

let tokenomicsChartInst = null;
let priceChartInst = null;
function initCharts() {
    const textColor = isDarkMode ? '#fff' : '#1a1a2e';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const ctx1 = document.getElementById('tokenomicsChart');
    if (ctx1) {
        if(tokenomicsChartInst) tokenomicsChartInst.destroy();
        tokenomicsChartInst = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Staking', 'Liquidity', 'Team', 'Development', 'Airdrop', 'Reserve'],
                datasets: [{ data: [40, 20, 15, 10, 10, 5], backgroundColor: ['#00c2ff', '#00ff88', '#7000ff', '#ff4757', '#ffa502', '#8b9bb4'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: textColor } } } }
        });
    }
    const ctx2 = document.getElementById('priceChart');
    if (ctx2) {
        if(priceChartInst) priceChartInst.destroy();
        priceChartInst = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{ label: 'PCH Price (USD)', data: [0.038, 0.041, 0.039, 0.042, 0.044, 0.043, 0.045], borderColor: '#00c2ff', backgroundColor: 'rgba(0, 194, 255, 0.1)', fill: true, tension: 0.4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { color: gridColor }, ticks: { color: textColor } } }, plugins: { legend: { display: false } } }
        });
    }
}
