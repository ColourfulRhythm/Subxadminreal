import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'

// Function to send password reset email
export async function resetAdminPassword() {
  try {
    await sendPasswordResetEmail(auth, 'subx@focalpointdev.com')
    console.log('Password reset email sent successfully!')
    return { success: true, message: 'Password reset email sent to subx@focalpointdev.com' }
  } catch (error: any) {
    console.error('Error sending password reset:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to send password reset email' 
    }
  }
}
