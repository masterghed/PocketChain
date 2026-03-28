// ==========================================
// POCKETCHAIN KYC SYSTEM - FIREBASE EDITION
// With Real Cloud Storage & Camera Capture
// ==========================================

import { auth, db, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { ref, uploadString, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

let currentStream = null;
let selfieDataUrl = null;
let idFile = null;

// --- CAMERA CONTROLS ---
window.openCameraModal = () => {
    document.getElementById('cameraModal').classList.add('active');
    
    // Request Camera Access
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => {
            currentStream = stream;
            document.getElementById('cameraVideo').srcObject = stream;
            document.getElementById('cameraVideo').style.display = 'block';
            document.getElementById('cameraCanvas').style.display = 'none';
            document.getElementById('captureBtn').style.display = 'inline-block';
            document.getElementById('retakeBtn').style.display = 'none';
            document.getElementById('confirmBtn').style.display = 'none';
        })
        .catch(err => {
            window.showToast('Error', 'Camera access denied or unavailable', 'error');
            console.error("Camera Error: ", err);
        });
};

window.closeCameraModal = () => {
    document.getElementById('cameraModal').classList.remove('active');
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
};

window.capturePhoto = () => {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw image to canvas
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // Convert to Base64 image
    selfieDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Update UI
    video.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'inline-block';
    document.getElementById('confirmBtn').style.display = 'inline-block';
};

window.retakePhoto = () => {
    selfieDataUrl = null;
    document.getElementById('cameraVideo').style.display = 'block';
    document.getElementById('cameraCanvas').style.display = 'none';
    document.getElementById('captureBtn').style.display = 'inline-block';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('confirmBtn').style.display = 'none';
};

window.confirmPhoto = () => {
    window.closeCameraModal();
    const preview = document.getElementById('selfiePreview');
    const filename = document.getElementById('selfieFileName');
    
    preview.innerHTML = `<img src="${selfieDataUrl}" alt="Selfie Preview">`;
    preview.classList.add('has-preview');
    filename.textContent = "Selfie Captured Successfully";
    window.showToast('Success', 'Selfie captured!');
};

// --- FILE UPLOADER ---
window.handleKYCFile = (input, previewId, filenameId) => {
    const file = input.files[0];
    if (!file) return;

    // Check size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        window.showToast('Error', 'File too large. Max 5MB allowed.', 'error');
        input.value = '';
        return;
    }

    idFile = file; // Save to global variable
    const preview = document.getElementById(previewId);
    const filename = document.getElementById(filenameId);
    
    filename.textContent = file.name;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="ID Preview">`;
            preview.classList.add('has-preview');
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = `<div class="file-icon"><i class="fas fa-file-pdf"></i><span>PDF Document</span></div>`;
        preview.classList.add('has-preview');
    }
};

window.openKYCModal = () => {
    if (!auth.currentUser) return window.showToast('Error', 'Please login first', 'error');
    if (window.currentUserData && window.currentUserData.isVerified) {
        return window.showToast('Info', 'Your account is already verified!');
    }
    document.getElementById('kycModal').classList.add('active');
};

window.closeKYCModal = () => {
    document.getElementById('kycModal').classList.remove('active');
};

// --- SUBMIT KYC TO FIREBASE CLOUD ---
// Hintayin ma-load ang DOM bago i-attach ang event listener
setTimeout(() => {
    const kycForm = document.getElementById('kycForm');
    if (kycForm) {
        kycForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Pigilan ang page refresh
            
            if (!auth.currentUser) return window.showToast('Error', 'Please login first', 'error');
            if (!idFile) return window.showToast('Error', 'Please upload your ID document', 'error');
            if (!selfieDataUrl) return window.showToast('Error', 'Please take a selfie with the camera', 'error');

            const btn = e.target.querySelector('.btn-submit');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading to Secure Server...';
            btn.disabled = true;

            try {
                const uid = auth.currentUser.uid;
                
                // 1. I-upload ang ID Image sa Firebase Storage
                const idRef = ref(storage, `kyc_documents/${uid}_id_${Date.now()}`);
                await uploadBytes(idRef, idFile);
                const idUrl = await getDownloadURL(idRef);

                // 2. I-upload ang Selfie sa Firebase Storage
                const selfieRef = ref(storage, `kyc_selfies/${uid}_selfie_${Date.now()}.jpg`);
                await uploadString(selfieRef, selfieDataUrl, 'data_url');
                const selfieUrl = await getDownloadURL(selfieRef);

                // 3. I-save ang mga text details at Image URLs sa Firestore Database
                await addDoc(collection(db, "kyc_submissions"), {
                    userId: uid,
                    fullName: document.getElementById('kycFullName').value,
                    birthDate: document.getElementById('kycBirthDate').value,
                    nationality: document.getElementById('kycNationality').value,
                    idType: document.getElementById('kycIdType').value,
                    idNumber: document.getElementById('kycIdNumber').value,
                    address: document.getElementById('kycAddress').value,
                    city: document.getElementById('kycCity').value,
                    country: document.getElementById('kycCountry').value,
                    phone: document.getElementById('kycPhone').value,
                    idUrl: idUrl,          // Link papunta sa ID image
                    selfieUrl: selfieUrl,  // Link papunta sa Selfie
                    status: "pending",
                    submittedAt: serverTimestamp()
                });

                // 4. Update UI para ipakita ang tagumpay
                window.closeKYCModal();
                window.showToast('Success', 'KYC application submitted securely!');
                
                const badge = document.getElementById('kycStatusBadge');
                if(badge) {
                    badge.className = 'kyc-badge pending';
                    badge.innerHTML = '<i class="fas fa-clock"></i> Pending Approval';
                }
                const statusText = document.getElementById('kycStatusText');
                if(statusText) {
                    statusText.textContent = 'Your KYC application is under review by our admin team. This usually takes 24-48 hours.';
                }

            } catch (error) {
                console.error("KYC Upload Error:", error);
                window.showToast('Error', 'Failed to submit KYC: ' + error.message, 'error');
            } finally {
                // Ibalik sa dati ang button kahit mag-error o mag-success
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
}, 1000);
