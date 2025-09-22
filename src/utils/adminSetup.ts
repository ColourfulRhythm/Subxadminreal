import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// Function to create admin user with custom claims
export async function createAdminUser(email: string, password: string) {
  try {
    // Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Set admin custom claims (this would typically be done server-side)
    // For now, we'll store admin status in Firestore
    await setDoc(doc(db, 'adminUsers', user.uid), {
      email: email,
      admin: true,
      createdAt: new Date(),
      permissions: ['read', 'write', 'delete', 'manage_users']
    })

    console.log('Admin user created successfully:', user.email)
    return user
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  }
}

// Function to sign in admin user
export async function signInAdmin(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Check if user is admin
    // const adminDoc = await doc(db, 'adminUsers', user.uid)
    // In a real app, you'd check the document here
    
    console.log('Admin signed in successfully:', user.email)
    return user
  } catch (error) {
    console.error('Error signing in admin:', error)
    throw error
  }
}

// Demo function to create the default admin account
export async function setupDefaultAdmin() {
  try {
    await createAdminUser('admin@subx.com', 'admin123')
    console.log('Default admin account created successfully!')
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin account already exists')
    } else {
      console.error('Error setting up default admin:', error)
    }
  }
}
