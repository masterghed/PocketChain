// ==========================================
// POCKETCHAIN KYC SYSTEM - PROFESSIONAL
// Know Your Customer Verification Module
// ==========================================

class KYCSystem {
    constructor() {
        this.kycData = JSON.parse(localStorage.getItem('pocketchain_kyc') || '{}');
        this.kycQueue = JSON.parse(localStorage.getItem('pocketchain_kyc_queue') || '[]');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateKYCStatus();
    }

    setupEventListeners() {
        // File upload previews
        const idFile = document.getElementById('kycIdFile');
        const selfieFile = document.getElementById('kycSelfieFile');
        
        if (idFile) {
            idFile.addEventListener('change', (e) => this.handleFileSelect(e, 'idPreview', 'idFileName'));
        }
        if (selfieFile) {
            selfieFile.addEventListener('change', (e) => this.handleFileSelect(e, 'selfiePreview', 'selfieFileName'));
        }

        // Form submission
        const form = document.getElementById('kycForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleKYCSubmit(e));
        }
    }

    handleFileSelect(event, previewId, filenameId) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            showToast('Error', 'Invalid file type. Use JPG, PNG, or PDF', 'error');
            event.target.value = '';
            return;
        }

        if (file.size > maxSize) {
            showToast('Error', 'File too large. Max 5MB allowed', 'error');
            event.target.value = '';
            return;
        }

        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById(previewId);
                const filename = document.getElementById(filenameId);
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    preview.classList.add('has-preview');
                }
                if (filename) filename.textContent = file.name;
            };
            reader.readAsDataURL(file);
        } else {
            const preview = document.getElementById(previewId);
            const filename = document.getElementById(filenameId);
            if (preview) {
                preview.innerHTML = `<div class="file-icon"><i class="fas fa-file-pdf"></i><span>PDF Document</span></div>`;
                preview.classList.add('has-preview');
            }
            if (filename) filename.textContent = file.name;
        }
    }

    handleKYCSubmit(e) {
        e.preventDefault();

        if (!currentUser) {
            showToast('Error', 'Please login first', 'error');
            return;
        }

        const formData = {
            userId: currentUser.id,
            fullName: document.getElementById('kycFullName')?.value.trim(),
            birthDate: document.getElementById('kycBirthDate')?.value,
            nationality: document.getElementById('kycNationality')?.value,
            idType: document.getElementById('kycIdType')?.value,
            idNumber: document.getElementById('kycIdNumber')?.value.trim(),
            address: document.getElementById('kycAddress')?.value.trim(),
            city: document.getElementById('kycCity')?.value.trim(),
            country: document.getElementById('kycCountry')?.value,
            phone: document.getElementById('kycPhone')?.value.trim(),
            submittedAt: new Date().toISOString(),
            status: 'pending',
            id: Date.now()
        };

        // Validation
        if (!formData.fullName || !formData.birthDate || !formData.nationality || 
            !formData.idType || !formData.idNumber || !formData.address || 
            !formData.city || !formData.country || !formData.phone) {
            showToast('Error', 'Please fill in all required fields', 'error');
            return;
        }

        // Check if already submitted
        if (this.kycData[currentUser.id] && this.kycData[currentUser.id].status === 'pending') {
            showToast('Pending', 'Your KYC is already under review', 'error');
            return;
        }

        if (this.kycData[currentUser.id] && this.kycData[currentUser.id].status === 'verified') {
            showToast('Verified', 'Your KYC is already approved', 'error');
            return;
        }

        // Save KYC data
        this.kycData[currentUser.id] = formData;
        localStorage.setItem('pocketchain_kyc', JSON.stringify(this.kycData));

        // Add to admin queue
        this.kycQueue.push({
            kycId: formData.id,
            userId: currentUser.id,
            userEmail: currentUser.email,
            submittedAt: formData.submittedAt,
            status: 'pending'
        });
        localStorage.setItem('pocketchain_kyc_queue', JSON.stringify(this.kycQueue));

        // Update UI
        this.updateKYCStatus();
        showToast('Submitted', 'KYC application submitted for review', 'success');
        
        // Reset form
        document.getElementById('kycForm')?.reset();
        document.getElementById('idPreview')?.classList.remove('has-preview');
        document.getElementById('selfiePreview')?.classList.remove('has-preview');
        document.getElementById('idFileName') && (document.getElementById('idFileName').textContent = 'No file selected');
        document.getElementById('selfieFileName') && (document.getElementById('selfieFileName').textContent = 'No file selected');
    }

    updateKYCStatus() {
        if (!currentUser) return;

        const kycInfo = this.kycData[currentUser.id];
        const statusBadge = document.getElementById('kycStatusBadge');
        const statusText = document.getElementById('kycStatusText');
        const kycForm = document.getElementById('kycForm');
        const kycSubmitted = document.getElementById('kycSubmitted');

        if (!kycInfo) {
            // Not submitted
            if (statusBadge) {
                statusBadge.className = 'kyc-badge unverified';
                statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Not Verified';
            }
            if (statusText) statusText.textContent = 'Complete KYC to unlock all features';
            if (kycForm) kycForm.style.display = 'block';
            if (kycSubmitted) kycSubmitted.style.display = 'none';
        } else if (kycInfo.status === 'pending') {
            // Pending
            if (statusBadge) {
                statusBadge.className = 'kyc-badge pending';
                statusBadge.innerHTML = '<i class="fas fa-clock"></i> Under Review';
            }
            if (statusText) statusText.textContent = 'Your application is being reviewed';
            if (kycForm) kycForm.style.display = 'none';
            if (kycSubmitted) {
                kycSubmitted.style.display = 'block';
                kycSubmitted.innerHTML = `
                    <div class="kyc-pending-msg">
                        <i class="fas fa-hourglass-half"></i>
                        <h4>Under Review</h4>
                        <p>Submitted: ${new Date(kycInfo.submittedAt).toLocaleDateString()}</p>
                        <p>Estimated review time: 24-48 hours</p>
                    </div>
                `;
            }
        } else if (kycInfo.status === 'verified') {
            // Verified
            if (statusBadge) {
                statusBadge.className = 'kyc-badge verified';
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
            }
            if (statusText) statusText.textContent = 'Your identity has been verified';
            if (kycForm) kycForm.style.display = 'none';
            if (kycSubmitted) {
                kycSubmitted.style.display = 'block';
                kycSubmitted.innerHTML = `
                    <div class="kyc-verified-msg">
                        <i class="fas fa-shield-alt"></i>
                        <h4>KYC Verified</h4>
                        <p>Verified on: ${new Date(kycInfo.verifiedAt).toLocaleDateString()}</p>
                        <p>Level: Full Access</p>
                    </div>
                `;
            }
        } else if (kycInfo.status === 'rejected') {
            // Rejected
            if (statusBadge) {
                statusBadge.className = 'kyc-badge rejected';
                statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Rejected';
            }
            if (statusText) statusText.textContent = kycInfo.rejectionReason || 'Please resubmit with correct documents';
            if (kycForm) kycForm.style.display = 'block';
            if (kycSubmitted) kycSubmitted.style.display = 'none';
        }
    }

    // Admin functions
    static approveKYC(userId) {
        const kycData = JSON.parse(localStorage.getItem('pocketchain_kyc') || '{}');
        if (kycData[userId]) {
            kycData[userId].status = 'verified';
            kycData[userId].verifiedAt = new Date().toISOString();
            kycData[userId].verifiedBy = 'admin';
            localStorage.setItem('pocketchain_kyc', JSON.stringify(kycData));
            
            // Update queue
            const queue = JSON.parse(localStorage.getItem('pocketchain_kyc_queue') || '[]');
            const idx = queue.findIndex(q => q.userId === userId);
            if (idx !== -1) {
                queue[idx].status = 'verified';
                localStorage.setItem('pocketchain_kyc_queue', JSON.stringify(queue));
            }
            
            return true;
        }
        return false;
    }

    static rejectKYC(userId, reason) {
        const kycData = JSON.parse(localStorage.getItem('pocketchain_kyc') || '{}');
        if (kycData[userId]) {
            kycData[userId].status = 'rejected';
            kycData[userId].rejectionReason = reason;
            kycData[userId].rejectedAt = new Date().toISOString();
            localStorage.setItem('pocketchain_kyc', JSON.stringify(kycData));
            
            // Update queue
            const queue = JSON.parse(localStorage.getItem('pocketchain_kyc_queue') || '[]');
            const idx = queue.findIndex(q => q.userId === userId);
            if (idx !== -1) {
                queue[idx].status = 'rejected';
                localStorage.setItem('pocketchain_kyc_queue', JSON.stringify(queue));
            }
            
            return true;
        }
        return false;
    }

    static getKYCStatus(userId) {
        const kycData = JSON.parse(localStorage.getItem('pocketchain_kyc') || '{}');
        return kycData[userId] || null;
    }
}

// Initialize KYC
let kycSystem;
document.addEventListener('DOMContentLoaded', () => {
    kycSystem = new KYCSystem();
});

// Global functions
function openKYCModal() {
    const modal = document.getElementById('kycModal');
    if (modal) {
        modal.classList.add('active');
        kycSystem.updateKYCStatus();
    }
}

function closeKYCModal() {
    const modal = document.getElementById('kycModal');
    if (modal) modal.classList.remove('active');
}
