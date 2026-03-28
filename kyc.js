// ==========================================
// POCKETCHAIN KYC SYSTEM - FIREBASE EDITION
// With Real Cloud Storage & Camera Capture
// ==========================================

import { auth } from './firebase-config.js';
import { submitKYC, getUserKYC } from './modules/firestore.js';
import { uploadKYCDocument, uploadKYCSelfie, validateFile } from './modules/storage.js';

// ==========================================
// KYC STATE
// ==========================================
const KYCState = {
  currentStream: null,
  selfieDataUrl: null,
  idFile: null,
  isSubmitting: false
};

// ==========================================
// CAMERA FUNCTIONS
// ==========================================

window.openCameraModal = () => {
  const modal = document.getElementById('cameraModal');
  if (modal) {
    modal.classList.add('active');
    startCamera();
  }
};

window.closeCameraModal = () => {
  const modal = document.getElementById('cameraModal');
  if (modal) {
    modal.classList.remove('active');
    stopCamera();
  }
};

async function startCamera() {
  try {
    KYCState.currentStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    
    if (video) {
      video.srcObject = KYCState.currentStream;
      video.style.display = 'block';
    }
    if (canvas) canvas.style.display = 'none';
    
    // Show/hide buttons
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    
    if (captureBtn) captureBtn.style.display = 'inline-block';
    if (retakeBtn) retakeBtn.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
    
  } catch (err) {
    console.error('Camera error:', err);
    window.showToast?.('Error', 'Could not access camera. Please allow camera permissions.', 'error');
  }
}

function stopCamera() {
  if (KYCState.currentStream) {
    KYCState.currentStream.getTracks().forEach(track => track.stop());
    KYCState.currentStream = null;
  }
  KYCState.selfieDataUrl = null;
}

window.capturePhoto = () => {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  
  if (!video || !canvas) return;
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  KYCState.selfieDataUrl = canvas.toDataURL('image/jpeg', 0.9);
  
  video.style.display = 'none';
  canvas.style.display = 'block';
  
  // Show/hide buttons
  const captureBtn = document.getElementById('captureBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  
  if (captureBtn) captureBtn.style.display = 'none';
  if (retakeBtn) retakeBtn.style.display = 'inline-block';
  if (confirmBtn) confirmBtn.style.display = 'inline-block';
};

window.retakePhoto = () => {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  
  if (video) video.style.display = 'block';
  if (canvas) canvas.style.display = 'none';
  
  KYCState.selfieDataUrl = null;
  
  // Show/hide buttons
  const captureBtn = document.getElementById('captureBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  
  if (captureBtn) captureBtn.style.display = 'inline-block';
  if (retakeBtn) retakeBtn.style.display = 'none';
  if (confirmBtn) confirmBtn.style.display = 'none';
};

window.confirmPhoto = () => {
  if (!KYCState.selfieDataUrl) return;
  
  const preview = document.getElementById('selfiePreview');
  const filename = document.getElementById('selfieFileName');
  
  if (preview) {
    preview.innerHTML = `<img src="${KYCState.selfieDataUrl}" alt="Selfie Preview">`;
    preview.classList.add('has-preview');
  }
  if (filename) filename.textContent = 'selfie_capture.jpg';
  
  closeCameraModal();
  window.showToast?.('Success', 'Selfie captured successfully');
};

// ==========================================
// FILE HANDLING
// ==========================================

window.handleKYCFile = (input, previewId, filenameId) => {
  const file = input.files[0];
  if (!file) return;
  
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  });
  
  if (!validation.valid) {
    window.showToast?.('Error', validation.error, 'error');
    input.value = '';
    return;
  }
  
  KYCState.idFile = file;
  
  const preview = document.getElementById(previewId);
  const filename = document.getElementById(filenameId);
  
  if (filename) filename.textContent = file.name;
  
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (preview) {
        preview.innerHTML = `<img src="${e.target.result}" alt="ID Preview">`;
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
};

// ==========================================
// KYC MODAL
// ==========================================

window.openKYCModal = async () => {
  if (!auth.currentUser) {
    window.showToast?.('Error', 'Please login first', 'error');
    return;
  }
  
  // Check existing KYC status
  try {
    const existingKYC = await getUserKYC(auth.currentUser.uid);
    
    if (existingKYC) {
      if (existingKYC.status === 'verified') {
        window.showToast?.('Info', 'Your KYC is already verified');
        return;
      }
      if (existingKYC.status === 'pending') {
        window.showToast?.('Pending', 'Your KYC is under review', 'error');
        return;
      }
    }
    
    const modal = document.getElementById('kycModal');
    if (modal) modal.classList.add('active');
    
  } catch (error) {
    console.error('KYC check error:', error);
    window.showToast?.('Error', 'Failed to check KYC status', 'error');
  }
};

window.closeKYCModal = () => {
  const modal = document.getElementById('kycModal');
  if (modal) modal.classList.remove('active');
};

// ==========================================
// KYC SUBMISSION
// ==========================================

// Setup form submission listener
document.addEventListener('DOMContentLoaded', () => {
  const kycForm = document.getElementById('kycForm');
  if (kycForm) {
    kycForm.addEventListener('submit', handleKYCSubmit);
  }
});

async function handleKYCSubmit(e) {
  e.preventDefault();
  
  if (KYCState.isSubmitting) return;
  
  if (!auth.currentUser) {
    window.showToast?.('Error', 'Please login first', 'error');
    return;
  }
  
  // Validate files
  if (!KYCState.idFile) {
    window.showToast?.('Error', 'Please upload your ID document', 'error');
    return;
  }
  
  if (!KYCState.selfieDataUrl) {
    window.showToast?.('Error', 'Please take a selfie with the camera', 'error');
    return;
  }
  
  // Get form data
  const formData = {
    fullName: document.getElementById('kycFullName')?.value.trim(),
    birthDate: document.getElementById('kycBirthDate')?.value,
    nationality: document.getElementById('kycNationality')?.value,
    idType: document.getElementById('kycIdType')?.value,
    idNumber: document.getElementById('kycIdNumber')?.value.trim(),
    address: document.getElementById('kycAddress')?.value.trim(),
    city: document.getElementById('kycCity')?.value.trim(),
    country: document.getElementById('kycCountry')?.value,
    phone: document.getElementById('kycPhone')?.value.trim()
  };
  
  // Validate required fields
  const requiredFields = ['fullName', 'birthDate', 'nationality', 'idType', 'idNumber', 'address', 'city', 'country', 'phone'];
  for (const field of requiredFields) {
    if (!formData[field]) {
      window.showToast?.('Error', 'Please fill in all required fields', 'error');
      return;
    }
  }
  
  KYCState.isSubmitting = true;
  
  const submitBtn = e.target.querySelector('.btn-submit');
  const originalText = submitBtn?.innerHTML;
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    submitBtn.disabled = true;
  }
  
  try {
    const uid = auth.currentUser.uid;
    
    // Upload ID document
    window.showToast?.('Uploading', 'Uploading ID document...');
    const idUpload = await uploadKYCDocument(uid, KYCState.idFile);
    
    if (!idUpload.success) {
      throw new Error(idUpload.error || 'Failed to upload ID document');
    }
    
    // Upload selfie
    window.showToast?.('Uploading', 'Uploading selfie...');
    const selfieUpload = await uploadKYCSelfie(uid, KYCState.selfieDataUrl);
    
    if (!selfieUpload.success) {
      throw new Error(selfieUpload.error || 'Failed to upload selfie');
    }
    
    // Submit KYC to Firestore
    window.showToast?.('Submitting', 'Submitting KYC application...');
    await submitKYC(uid, formData, idUpload.url, selfieUpload.url);
    
    // Success
    window.closeKYCModal?.();
    window.showToast?.('Success', 'KYC application submitted successfully!');
    
    // Update KYC badge
    const badge = document.getElementById('kycStatusBadge');
    const statusText = document.getElementById('kycStatusText');
    
    if (badge) {
      badge.className = 'kyc-badge pending';
      badge.innerHTML = '<i class="fas fa-clock"></i> Pending Approval';
    }
    if (statusText) {
      statusText.textContent = 'Your KYC application is under review by our admin team. This usually takes 24-48 hours.';
    }
    
    // Reset form
    e.target.reset();
    document.getElementById('idPreview')?.classList.remove('has-preview');
    document.getElementById('selfiePreview')?.classList.remove('has-preview');
    document.getElementById('idFileName').textContent = 'Upload ID (JPG, PNG, PDF)';
    document.getElementById('selfieFileName').textContent = 'Take Selfie';
    
    KYCState.idFile = null;
    KYCState.selfieDataUrl = null;
    
  } catch (error) {
    console.error('KYC submission error:', error);
    window.showToast?.('Error', error.message || 'Failed to submit KYC', 'error');
  } finally {
    KYCState.isSubmitting = false;
    if (submitBtn) {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }
}
