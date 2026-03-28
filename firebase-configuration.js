import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== "masterghed@pocketchain.network") {
        alert("Access Denied: Admins Only");
        window.location.href = "index.html";
    } else {
        listenToKYC();
    }
});

function listenToKYC() {
    const q = query(collection(db, "kyc_submissions"), where("status", "==", "pending"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('adminKycList');
        if (snapshot.empty) {
            container.innerHTML = `<div class="empty-state"><p>No pending KYC submissions.</p></div>`;
            return;
        }

        container.innerHTML = snapshot.docs.map(d => {
            const data = d.data();
            return `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; border: 1px solid var(--border);">
                <div>
                    <img src="${data.selfieUrl}" style="width:60px; height:60px; border-radius:8px; object-fit:cover; border: 1px solid var(--primary);">
                    <a href="${data.idUrl}" target="_blank" style="color:var(--primary); margin-left: 10px; font-size: 0.8rem;">View ID</a>
                </div>
                <div>
                    <strong style="color:#fff;">${data.fullName}</strong><br>
                    <small style="color:var(--text-muted);">${data.country} | ID: ${data.idNumber}</small>
                </div>
                <div>
                    <button onclick="approveKYC('${d.id}', '${data.userId}')" class="btn-primary" style="background:var(--secondary); color:#000;">Approve</button>
                    <button onclick="rejectKYC('${d.id}')" class="btn-primary" style="background:var(--danger);">Reject</button>
                </div>
            </div>`;
        }).join('');
    });
}

window.approveKYC = async (subId, userId) => {
    if(!confirm("Approve this user?")) return;
    await updateDoc(doc(db, "kyc_submissions", subId), { status: "verified" });
    await updateDoc(doc(db, "users", userId), { isVerified: true });
    alert("User Approved!");
};

window.rejectKYC = async (subId) => {
    if(!confirm("Reject this submission?")) return;
    await updateDoc(doc(db, "kyc_submissions", subId), { status: "rejected" });
};
