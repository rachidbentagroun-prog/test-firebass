/**
 * CLIENT-SIDE: Grant Super Admin Access
 * 
 * This script can be run in the browser console or as a one-time utility
 * when logged in as any user with Firestore access.
 * 
 * INSTRUCTIONS:
 * 1. Make sure the user isambk92@gmail.com has signed up in your app
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 */

(async function grantSuperAdminAccessClient() {
  console.log('🔍 Granting super admin access to isambk92@gmail.com...');
  
  try {
    // Import Firestore from your Firebase config
    const { db } = await import('./services/firebase.js');
    const { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    
    const TARGET_EMAIL = 'isambk92@gmail.com';
    
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', TARGET_EMAIL));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ User not found. Please ensure the user has signed up first.');
      console.log('To sign up: Go to your app and register with:');
      console.log('   Email: isambk92@gmail.com');
      console.log('   Password: Lwalida2020');
      return;
    }
    
    // Update user role
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log('✅ User found:', userId);
    console.log('   Current role:', userData.role || 'not set');
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'super_admin',
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Role updated to super_admin');
    console.log('\n🎉 Success! You can now log in with:');
    console.log('   Email: isambk92@gmail.com');
    console.log('   Password: Lwalida2020');
    console.log('   Then navigate to /admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you are logged in to your app');
    console.log('2. Ensure the user has signed up first');
    console.log('3. Check that Firestore rules allow write access');
  }
})();
