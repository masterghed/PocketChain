import { db, auth } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

window.connectWalletOnChain = async (type) => {
    if (type === 'metamask' && window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            
            // I-save ang wallet sa database ng user
            if (auth.currentUser) {
                await updateDoc(doc(db, "users", auth.currentUser.uid), { walletAddress: address });
            }
            return address;
        } catch (e) { 
            console.error("Wallet connection failed"); 
            return null;
        }
    } else { 
        alert("Please install MetaMask!"); 
        return null;
    }
};
