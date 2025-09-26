export interface DocumentMetadata {
  filename: string
  size: number
  type: string
  uploadedAt: Date
  url: string
}

export class FileManagementService {
  /**
   * Download a document from the provided URL
   */
  static async downloadDocument(url: string, filename: string): Promise<void> {
    try {
      console.log('📥 Downloading document:', { url, filename })
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.target = '_blank'
      
      // Add to DOM temporarily
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      
      console.log('✅ Document download initiated successfully')
    } catch (error) {
      console.error('❌ Error downloading document:', error)
      throw new Error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Preview a document in a new tab
   */
  static async previewDocument(url: string): Promise<void> {
    try {
      console.log('👁️ Previewing document:', url)
      window.open(url, '_blank', 'noopener,noreferrer')
      console.log('✅ Document preview opened successfully')
    } catch (error) {
      console.error('❌ Error previewing document:', error)
      throw new Error(`Failed to preview document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate document type based on URL or content
   */
  static async validateDocumentType(url: string): Promise<boolean> {
    try {
      console.log('🔍 Validating document type:', url)
      
      // Check if URL is valid
      if (!url || !url.startsWith('http')) {
        return false
      }

      // Check file extension
      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
      const hasValidExtension = validExtensions.some(ext => 
        url.toLowerCase().includes(ext)
      )

      if (!hasValidExtension) {
        console.warn('⚠️ Document does not have a valid file extension')
        return false
      }

      console.log('✅ Document type validation passed')
      return true
    } catch (error) {
      console.error('❌ Error validating document type:', error)
      return false
    }
  }

  /**
   * Get document metadata from URL
   */
  static async getDocumentMetadata(url: string): Promise<DocumentMetadata> {
    try {
      console.log('📊 Getting document metadata:', url)
      
      // Extract filename from URL
      const urlParts = url.split('/')
      const filename = urlParts[urlParts.length - 1] || 'document'
      
      // For now, return basic metadata
      // In a real implementation, you might fetch the file to get actual size and type
      const metadata: DocumentMetadata = {
        filename,
        size: 0, // Would need to fetch file to get actual size
        type: this.getFileTypeFromUrl(url),
        uploadedAt: new Date(),
        url
      }

      console.log('✅ Document metadata retrieved:', metadata)
      return metadata
    } catch (error) {
      console.error('❌ Error getting document metadata:', error)
      throw new Error(`Failed to get document metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file type from URL
   */
  private static getFileTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf'
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'doc':
        return 'application/msword'
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      default:
        return 'application/octet-stream'
    }
  }

  /**
   * Check if document is accessible
   */
  static async isDocumentAccessible(url: string): Promise<boolean> {
    try {
      console.log('🔗 Checking document accessibility:', url)
      
      const response = await fetch(url, { method: 'HEAD' })
      const isAccessible = response.ok
      
      console.log(`${isAccessible ? '✅' : '❌'} Document accessibility:`, isAccessible)
      return isAccessible
    } catch (error) {
      console.error('❌ Error checking document accessibility:', error)
      return false
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file icon based on file type
   */
  static getFileIcon(type: string): string {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    if (type.includes('word')) return '📝'
    return '📁'
  }
}
