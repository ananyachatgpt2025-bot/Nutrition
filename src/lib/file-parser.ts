import mammoth from 'mammoth'
import { PDFDocument } from 'pdf-lib'

export async function parseDocumentText(file: File): Promise<string> {
  const fileName = file.name.toLowerCase()
  
  if (fileName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value || ''
    } catch (error) {
      console.error('Error parsing DOCX:', error)
      return ''
    }
  } else if (fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPages()
      
      // Note: pdf-lib doesn't extract text directly
      // For production, you'd want to use a proper PDF text extraction library
      // This is a placeholder that returns basic info
      return `PDF document with ${pages.length} pages. Content extraction requires server-side processing.`
    } catch (error) {
      console.error('Error parsing PDF:', error)
      return ''
    }
  } else if (fileName.endsWith('.txt')) {
    return await file.text()
  }
  
  return ''
}