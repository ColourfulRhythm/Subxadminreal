import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// Function to create subadmin account
export async function createSubAdminAccount() {
  const email = 'godunderGod100@gmail.com'
  const password = 'Pass1234%%'
  
  try {
    // First, try to create the account fresh
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Set subadmin status in Firestore (optional - for tracking)
    await setDoc(doc(db, 'subAdminUsers', user.uid), {
      email: email,
      role: 'subadmin',
      createdAt: new Date(),
      permissions: ['view_users', 'contact_users']
    })

    console.log('✅ SubAdmin account created successfully!')
    return { 
      success: true, 
      message: `SubAdmin account created! Email: ${email}, Password: ${password}` 
    }
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      // Account exists, try to sign in to see if password works
      try {
        await signInWithEmailAndPassword(auth, email, password)
        return { 
          success: true, 
          message: `Account exists and password is correct! You can now login with: ${email} / ${password}` 
        }
      } catch (signInError: any) {
        return { 
          success: false, 
          message: `Account exists but password is wrong. Try: ${password}` 
        }
      }
    } else {
      console.error('Error creating subadmin account:', error)
      return { 
        success: false, 
        message: 'Error: ' + error.message 
      }
    }
  }
}

