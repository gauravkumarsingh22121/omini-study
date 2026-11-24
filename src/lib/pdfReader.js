import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker to use the CDN
// We use the version of pdfjs-dist that is installed
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extracts text from a PDF file page by page.
 * @param {File | Blob | ArrayBuffer} file - The PDF file
 * @returns {Promise<string[]>} Array of strings, where each string is the text content of a page
 */
export async function extractTextFromPDF(file) {
  try {
    let data;
    if (file instanceof File || file instanceof Blob) {
      data = await file.arrayBuffer();
    } else if (file instanceof ArrayBuffer) {
      data = file;
    } else {
      throw new Error('Unsupported file type. Must be File, Blob, or ArrayBuffer.');
    }

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    const extractedTextPages = [];

    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Combine the text items into a single string for the page
      const pageText = textContent.items.map(item => item.str).join(' ');
      extractedTextPages.push(pageText);
    }

    return extractedTextPages;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}
