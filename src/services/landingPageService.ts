import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface LandingPage {
  id?: string
  name: string
  title: string
  slug: string
  description: string
  status: 'draft' | 'published'
  blocks: any[]
  meta?: {
    ogImage: string
    description: string
    keywords: string[]
  }
  design?: {
    primaryColor: string
    backgroundColor: string
    font: string
    headingSize: 'small' | 'medium' | 'large' | 'x-large'
  }
  createdAt?: Date
  updatedAt?: Date
  publishedAt?: Date
}

export interface PublishedPage {
  id: string
  url: string
  analytics: {
    views: number
    conversions: number
    clicks: number
  }
}

export class LandingPageService {
  
  // Save landing page to Firebase
  static async saveLandingPage(page: LandingPage): Promise<string> {
    try {
      if (page.id) {
        // Update existing page
        const pageRef = doc(db, 'landing_pages', page.id)
        await updateDoc(pageRef, {
          ...page,
          updatedAt: serverTimestamp()
        })
        return page.id
      } else {
        // Create new page
        const pagesRef = collection(db, 'landing_pages')
        const docRef = await addDoc(pagesRef, {
          ...page,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        return docRef.id
      }
    } catch (error) {
      console.error('Error saving landing page:', error)
      throw new Error('Failed to save landing page')
    }
  }

  // Get all landing pages
  static async getLandingPages(): Promise<LandingPage[]> {
    try {
      const pagesRef = collection(db, 'landing_pages')
      const snapshot = await getDocs(pagesRef)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as LandingPage[]
    } catch (error) {
      console.error('Error fetching landing pages:', error)
      return []
    }
  }

  // Get single landing page
  static async getLandingPage(id: string): Promise<LandingPage | null> {
    try {
      const pageRef = doc(db, 'landing_pages', id)
      const pageSnap = await getDoc(pageRef)
      
      if (pageSnap.exists()) {
        return {
          id: pageSnap.id,
          ...pageSnap.data(),
          createdAt: pageSnap.data().createdAt?.toDate(),
          updatedAt: pageSnap.data().updatedAt?.toDate()
        } as LandingPage
      }
      return null
    } catch (error) {
      console.error('Error fetching landing page:', error)
      return null
    }
  }

  // Delete landing page
  static async deleteLandingPage(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'landing_pages', id))
      return true
    } catch (error) {
      console.error('Error deleting landing page:', error)
      return false
    }
  }

  // Publish landing page
  static async publishLandingPage(id: string): Promise<string> {
    try {
      const pageRef = doc(db, 'landing_pages', id)
      await updateDoc(pageRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // Generate public URL
      const baseUrl = window.location.origin
      return `${baseUrl}/landing/${id}`
    } catch (error) {
      console.error('Error publishing landing page:', error)
      throw new Error('Failed to publish landing page')
    }
  }

  // Duplicate landing page
  static async duplicatePage(id: string, name: string): Promise<string> {
    try {
      const originalPage = await this.getLandingPage(id)
      if (!originalPage) throw new Error('Original page not found')

      const trimmedName = (name || '').trim()
      const safeName = trimmedName || `${originalPage.name} (Copy)`
      const safeSlugBase = safeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const duplicatePage: LandingPage = {
        ...originalPage,
        id: undefined, // New ID will be generated
        name: safeName,
        slug: `${safeSlugBase || originalPage.slug}-copy`,
        status: 'draft',
        createdAt: undefined,
        updatedAt: undefined
      }

      return await this.saveLandingPage(duplicatePage)
    } catch (error) {
      console.error('Error duplicating landing page:', error)
      throw new Error('Failed to duplicate landing page')
    }
  }

  // Update analytics
  static async updateAnalytics(pageId: string, event: 'view' | 'conversion' | 'click'): Promise<void> {
    try {
      const pageRef = doc(db, 'landing_page_analytics', pageId)
      // Use set with merge to update analytics counters
      await updateDoc(pageRef, {
        [event]: serverTimestamp(),
        [`${event}Count`]: +1 // Increment counter
      })
    } catch (error) {
      console.error(`Error updating ${event} analytics:`, error)
    }
  }

  // Get page analytics
  static async getAnalytics(pageId: string): Promise<{
    views: number
    conversions: number
    clicks: number
    conversionRate: number
  }> {
    try {
      const analyticsRef = doc(db, 'landing_page_analytics', pageId)
      const snapshot = await getDoc(analyticsRef)
      
      if (snapshot.exists()) {
        const data = snapshot.data()
        const views = data.viewCount || 0
        const conversions = data.conversionCount || 0
        const clicks = data.clickCount || 0
        
        return {
          views,
          conversions,
          clicks,
          conversionRate: views > 0 ? (conversions / views) * 100 : 0
        }
      }
      
      return {
        views: 0,
        conversions: 0,
        clicks: 0,
        conversionRate: 0
      }
    } catch (error) {
      console.error('Error getting analytics:', error)
      return {
        views: 0,
        conversions: 0,
        clicks: 0,
        conversionRate: 0
      }
    }
  }

  // Get popular pages
  static async getPopularPages(limit: number = 10): Promise<Array<LandingPage & { analytics: any }>> {
    try {
      // Get pages ordered by views
      const pagesQuery = query(
        collection(db, 'landing_pages'),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc')
      )
      const pagesSnapshot = await getDocs(pagesQuery)
      
      const pages = pagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as LandingPage[]

      // Get analytics for each page
      const pagesWithAnalytics = await Promise.all(
        pages.map(async (page) => ({
          ...page,
          analytics: await this.getAnalytics(page.id!)
        }))
      )

      // Sort by conversion rate and return top N
      return pagesWithAnalytics
        .sort((a, b) => b.analytics.conversionRate - a.analytics.conversionRate)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting popular pages:', error)
      return []
    }
  }

  // Export page as JSON
  static async exportPage(id: string): Promise<string> {
    try {
      const page = await this.getLandingPage(id)
      if (!page) throw new Error('Page not found')

      const exportData = {
        ...page,
        exportedAt: new Date().toISOString()
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Error exporting page:', error)
      throw new Error('Failed to export page')
    }
  }

  // Import page from JSON
  static async importPage(jsonData: string): Promise<string> {
    try {
      const pageData = JSON.parse(jsonData)
      
      // Remove fields that shouldn't be imported
      delete pageData.id
      delete pageData.createdAt
      delete pageData.updatedAt
      delete pageData.publishedAt
      
      // Add import adjustments
      const importPage: LandingPage = {
        ...pageData,
        slug: `${pageData.slug || 'imported'}-${Date.now()}`,
        status: 'draft',
        name: `${pageData.name || 'Imported Page'} (Imported)`
      }

      return await this.saveLandingPage(importPage)
    } catch (error) {
      console.error('Error importing page:', error)
      throw new Error('Failed to import page')
    }
  }
}
