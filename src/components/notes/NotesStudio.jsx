import React, { useState } from 'react';
import { NotesRenderer } from './NotesRenderer';
import { NOTE_THEMES, DETAIL_LEVELS } from '../../services/notesSchema';
import { 
  Download, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Check, 
  Layers, 
  X, 
  Printer, 
  Sliders, 
  Loader2 
} from 'lucide-react';

/**
 * Notes Studio & Document Viewport.
 * Provides controls for Theme switching (Handwritten vs Academic vs Exam),
 * Detail Level selection, live progress stages, and standard A4 PDF Export.
 */
export function NotesStudio({
  document,
  isGenerating,
  progressStage,
  onRegenerate,
  onClose
}) {
  const [selectedTheme, setSelectedTheme] = useState(NOTE_THEMES.HANDWRITTEN);
  const [selectedDetail, setSelectedDetail] = useState(DETAIL_LEVELS.DETAILED);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrintPdf = () => {
    const printArea = document.getElementById('printable-notes-area');
    if (!printArea) {
      window.print();
      return;
    }

    setIsExporting(true);

    // Open an isolated window specifically for printing the notes document
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      // Fallback if popup blocker intercepted window.open
      window.print();
      setIsExporting(false);
      return;
    }

    const title = document?.chapter_title || 'Handwritten Study Notes';

    // Gather styles from main page
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Kalam:wght@400;700&display=swap" rel="stylesheet" />
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 12mm 15mm 12mm;
            }
            html, body {
              background: #fdfbf7 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              font-family: 'Caveat', 'Kalam', cursive, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .notes-document-wrapper {
              max-width: 100% !important;
              margin: 0 !important;
            }
            .a4-notes-page {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 10px 15px !important;
              width: 100% !important;
              background-color: transparent !important;
            }
            .section-container {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 24px;
            }
            .notebook-ruled-paper {
              background-color: #fdfbf7 !important;
              background-image: 
                linear-gradient(90deg, transparent 48px, #f87171 49px, #f87171 50.5px, transparent 51px),
                repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 32px) !important;
              background-size: 100% 32px, 100% 32px !important;
              line-height: 32px !important;
            }
          </style>
        </head>
        <body class="notebook-ruled-paper">
          <div style="padding: 10px 15px;">
            ${printArea.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Trigger print once content & styles finish loading
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setIsExporting(false);
      }, 350);
    };

    // Fallback trigger if onload already fired
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.warn('printWindow trigger fallback:', e);
      }
      setIsExporting(false);
    }, 700);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FAF9F5] overflow-hidden select-text">
      {/* ========================================================= */}
      {/* STUDIO TOOLBAR: THEMES, DETAIL SELECTOR & PDF EXPORT     */}
      {/* ========================================================= */}
      <div className="p-3 sm:p-4 bg-white border-b border-[#DDD8CB] flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-2xs z-20">
        
        {/* Left: Document Info & Handwritten Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-bold text-xs sm:text-sm text-[#1C1A17] font-serif truncate max-w-[150px] sm:max-w-[200px]">
              {document?.chapter_title || 'Handwritten Notes'}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

          {/* Dedicated Handwritten Notes Badge (Academic and Exam removed) */}
          <div className="px-3 py-1 rounded-xl bg-amber-100/90 border border-amber-200 text-amber-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
            <span>✍️ Handwritten Notes</span>
          </div>
        </div>

        {/* Right: PDF Export, Regenerate & Close */}
        <div className="flex items-center gap-2">
          {/* Direct PDF Download Button */}
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={isGenerating || !document || isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DDD8CB] hover:bg-gray-50 text-xs font-bold text-[#1C1A17] transition shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Download Notes as PDF"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D9488]" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#0D9488]" />
            )}
            <span className="hidden sm:inline">{isExporting ? 'Downloading...' : 'Export PDF'}</span>
          </button>

          {/* Regenerate Button */}
          <button
            type="button"
            onClick={() => onRegenerate && onRegenerate()}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-teal-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'Regenerate'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-black transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DOCUMENT PREVIEW BODY                                     */}
      {/* ========================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>
        ) : document ? (
          <div id="printable-notes-area">
            <NotesRenderer document={document} theme={selectedTheme} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#8E8B82] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <BookOpen className="w-6 h-6 stroke-1.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-[#1C1A17] font-serif">Note generation is required</h4>
              <p className="text-xs text-[#8E8B82] max-w-sm">
                No handwritten notes have been generated for this material yet. Please choose your notes preference in the right chat section to generate.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
