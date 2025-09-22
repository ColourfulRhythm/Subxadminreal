import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// Function to delete and recreate admin account with correct password
export async function recreateAdminAccount() {
  try {
    // First, try to create the account fresh
    const userCredential = await createUserWithEmailAndPassword(auth, 'subx@focalpointdev.com', 'Qwert1234%')
    const user = userCredential.user

    // Set admin status in Firestore
    await setDoc(doc(db, 'adminUsers', user.uid), {
      email: 'subx@focalpointdev.com',
      admin: true,
      createdAt: new Date(),
      permissions: ['read', 'write', 'delete', 'manage_users']
    })

    console.log('Fresh admin account created successfully!')
    return { 
      success: true, 
      message: 'Fresh admin account created! Email: subx@focalpointdev.com, Password: Qwert1234%' 
    }
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      // Account exists, try to sign in to see if password works
      try {
        await signInWithEmailAndPassword(auth, 'subx@focalpointdev.com', 'Qwert1234%')
        return { 
          success: true, 
          message: 'Account exists and password is correct! You can now login with: subx@focalpointdev.com / Qwert1234%' 
        }
      } catch (signInError: any) {
        return { 
          success: false, 
          message: 'Account exists but password is wrong. Try: Qwert1234%' 
        }
      }
    } else {
      console.error('Error creating admin account:', error)
      return { 
        success: false, 
        message: 'Error: ' + error.message 
      }
    }
  }
}
