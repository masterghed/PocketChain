// ==========================================
// POCKETCHAIN KYC SYSTEM - COMPLETE
// With Working Camera Functionality
// ==========================================

class KYCSystem {
    constructor() {
        this.kycData = JSON.parse(localStorage.getItem('pocketchain_kyc') || '{}');
        this.kycQueue = JSON.parse(localStorage.getItem('pocketchain_kyc_queue') || '[]');
        this.stream = null;
        this.capturedImage = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateKYCStatus();
    }

    setupEventListeners() {
        const form = document.getElementById('kycForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleKYCSubmit(e));
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

        if (!formData.fullName || !formData.birthDate || !formData.nationality || 
            !formData.idType || !formData.idNumber || !formData.address || 
            !formData.city || !formData.country || !formData.phone) {
            showToast('Error', 'Please fill in all required fields', 'error');
            return;
        }

        if (this.kycData[currentUser.id] && this.kycData[currentUser.id].status === 'pending') {
            showToast('Pending', 'Your KYC is already under review', 'error');
            return;
        }

        if (this.kycData[currentUser.id] && this.kycData[currentUser.id].status === 'verified') {
            showToast('Verified', 'Your KYC is already approved', 'error');
            return;
        }

        this.kycData[currentUser.id] = formData;
        localStorage.setItem('pocketchain_kyc', JSON.stringify(this.kycData));

        this.kycQueue.push({
            kycId: formData.id,
            userId: currentUser.id,
            userEmail: currentUser.email,
            submittedAt: formData.submittedAt,
            status: 'pending'
        });
        localStorage.setItem('pocketchain_kyc_queue', JSON.stringify(this.kycQueue));

        this.updateKYCStatus();
        showToast('Submitted', 'KYC application submitted for review', 'success');
        
        document.getElementById('kycForm')?.reset();
        document.getElementById('idPreview')?.classList.remove('has-preview');
        document.getElementById('selfiePreview')?.classList.remove('has-preview');
    }

    updateKYCStatus() {
        if (!currentUser) return;

        const kycInfo = this.kycData[currentUser.id];
        const statusBadge = document.getElementById('kycStatusBadge');
        const statusText = document.getElementById('kycStatusText');
        const kycForm = document.getElementById('kycForm');
        const kycSubmitted = document.getElementById('kycSubmittedView');

        if (!kycInfo) {
            if (statusBadge) {
                statusBadge.className = 'kyc-badge unverified';
                statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Not Verified';
            }
            if (statusText) statusText.textContent = 'Complete KYC to unlock all features';
            if (kycForm) kycForm.style.display = 'block';
            if (kycSubmitted) kycSubmitted.style.display = 'none';
        } else if (kycInfo.status === 'pending') {
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
        }
    }

    // Camera Functions
    async openCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            const video = document.getElementById('cameraVideo');
            const canvas = document.getElementById('cameraCanvas');
            
            if (video) {
                video.srcObject = this.stream;
                video.style.display = 'block';
            }
            if (canvas) canvas.style.display = 'none';
            
            document.getElementById('captureBtn').style.display = 'block';
            document.getElementById('retakeBtn').style.display = 'none';
            document.getElementById('confirmBtn').style.display = 'none';
            
        } catch (err) {
            console.error('Camera error:', err);
            showToast('Error', 'Could not access camera. Please allow camera permissions.', 'error');
        }
    }

    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        
        if (!video || !canvas) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        video.style.display = 'none';
        canvas.style.display = 'block';
        
        this.capturedImage = canvas.toDataURL('image/jpeg', 0.9);
        
        document.getElementById('captureBtn').style.display = 'none';
        document.getElementById('retakeBtn').style.display = 'block';
        document.getElementById('confirmBtn').style.display = 'block';
    }

    retakePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        
        if (video) video.style.display = 'block';
        if (canvas) canvas.style.display = 'none';
        
        this.capturedImage = null;
        
        document.getElementById('captureBtn').style.display = 'block';
        document.getElementById('retakeBtn').style.display = 'none';
        document.getElementById('confirmBtn').style.display = 'none';
    }

    confirmPhoto() {
        if (!this.capturedImage) return;
        
        const preview = document.getElementById('selfiePreview');
        const filename = document.getElementById('selfieFileName');
        
        if (preview) {
            preview.innerHTML = `<img src="${this.capturedImage}" alt="Selfie Preview">`;
            preview.classList.add('has-preview');
        }
        if (filename) filename.textContent = 'selfie_capture.jpg';
        
        const selfieInput = document.getElementById('kycSelfieFile');
        if (selfieInput) {
            fetch(this.capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'selfie_capture.jpg', { type: 'image/jpeg' });
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    selfieInput.files = dataTransfer.files;
                });
        }
        
        this.closeCamera();
        closeCameraModal();
        showToast('Success', 'Selfie captured successfully');
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

function handleKYCFile(input, previewId, filenameId) {
    const file = input.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
        showToast('Error', 'Invalid file type. Use JPG, PNG, or PDF', 'error');
        input.value = '';
        return;
    }

    if (file.size > maxSize) {
        showToast('Error', 'File too large. Max 5MB allowed', 'error');
        input.value = '';
        return;
    }

    const preview = document.getElementById(previewId);
    const filename = document.getElementById(filenameId);
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.classList.add('has-preview');
            }
        };
        reader.readAsDataURL(file);
    } else {
        if (preview) {
            preview.innerHTML = `<div class="file-icon"><i class="fas fa-file-pdf"></i><span>PDF Document</span></div>`;
            preview.classList.add('has-preview');
        }
    }
    
    if (filename) filename.textContent = file.name;
}

function openCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.classList.add('active');
        kycSystem.openCamera();
    }
}

function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.classList.remove('active');
        kycSystem.closeCamera();
    }
}

function capturePhoto() {
    kycSystem.capturePhoto();
}

function retakePhoto() {
    kycSystem.retakePhoto();
}

function confirmPhoto() {
    kycSystem.confirmPhoto();
}
