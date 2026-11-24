import React from 'react';
import { NOTE_CONTENT_TYPES, NOTE_THEMES } from '../../services/notesSchema';
import { 
  DefinitionBlock, 
  FormulaBlock, 
  DerivationBlock, 
  ComparisonTableBlock, 
  NumericalBlock, 
  ExamQuestionBlock, 
  WarningBlock, 
  ImportantPointBlock, 
  DiagramBlock 
} from './NoteBlocks';
import { TextWithMath, MathRenderer } from './MathRenderer';
import { BookOpen, CheckCircle, Clock, Sparkles } from 'lucide-react';

/**
 * Main Notes Renderer Component.
 * Iterates through structured JSON elements and maps them directly to typed visual components.
 * Independent of the AI generation engine.
 */
export function NotesRenderer({ document, theme = NOTE_THEMES.HANDWRITTEN, onExportPdf = null }) {
  if (!document) return null;

  const isHandwritten = theme === NOTE_THEMES.HANDWRITTEN;
  const isAcademic = theme === NOTE_THEMES.ACADEMIC;
  const isExam = theme === NOTE_THEMES.EXAM;

  return (
    <div className={`notes-document-wrapper max-w-4xl mx-auto w-full transition-all ${
      isHandwritten 
        ? 'font-handwriting text-[#1e3a8a]' 
        : isAcademic 
        ? 'font-sans text-[#1e293b]' 
        : 'font-sans text-[#0f172a]'
    }`}>
      {/* ========================================================= */}
      {/* A4 PAGE 1: CHAPTER COVER & TOPIC CHECKLIST               */}
      {/* ========================================================= */}
      <div className={`a4-notes-page p-6 sm:p-10 mb-8 rounded-3xl border shadow-sm relative overflow-hidden ${
        isHandwritten 
          ? 'notebook-ruled-paper border-[#DDD8CB]' 
          : isAcademic 
          ? 'bg-white border-gray-200' 
          : 'bg-[#FAF9F5] border-emerald-300 border-t-8 border-t-emerald-600'
      }`}>
        {/* Chapter Header Ribbon */}
        <div className="border-b-2 border-dashed border-[#DDD8CB] pb-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              isHandwritten ? 'bg-amber-100 text-amber-900' : 'bg-teal-100 text-teal-900'
            }`}>
              {document.subject || 'University Academic Notes'}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
              <Clock className="w-3.5 h-3.5" />
              <span>Est. {document.estimated_reading_time || '30 mins'}</span>
            </div>
          </div>

          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isHandwritten ? 'text-[#1e3a8a] font-handwriting' : 'text-[#1C1A17] font-serif'
          }`}>
            {document.chapter_title}
          </h1>
        </div>

        {/* Coverage Checklist Box */}
        {document.coverage_checklist && document.coverage_checklist.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-white/80 border border-[#DDD8CB] shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-2 flex items-center gap-1.5 font-sans">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <span>Syllabus & Chapter Coverage Checklist</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {document.coverage_checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[#1C1A17]">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTIONS ITERATION                                        */}
        {/* ========================================================= */}
        <div className="space-y-8">
          {document.sections?.map((section, sIdx) => (
            <div key={section.id || sIdx} className="section-container pt-3">
              {/* Section Heading Banner */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#1C1A17]/15">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center justify-center font-sans">
                    {sIdx + 1}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#1C1A17]">
                    {section.title}
                  </h2>
                </div>
                {section.importance && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-sans ${
                    section.importance === 'HIGH' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    ★ {section.importance} PRIORITY
                  </span>
                )}
              </div>

              {/* Render Section Blocks */}
              <div className="space-y-3.5 pl-1 sm:pl-3">
                {section.blocks?.map((block, bIdx) => (
                  <RenderContentBlock key={bIdx} block={block} theme={theme} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* CHAPTER-END FORMULA SHEET & REVISION CHECKLIST            */}
        {/* ========================================================= */}
        {document.formula_sheet && document.formula_sheet.length > 0 && (
          <div className="mt-10 pt-6 border-t-2 border-dashed border-[#DDD8CB]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-2 font-sans">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Chapter Formula Sheet</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {document.formula_sheet.map((f, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
                  <span className="font-bold text-xs text-blue-950 block mb-1">{f.title}</span>
                  <div className="py-1">
                    <MathRenderer latex={f.latex} inline={true} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chapter Summary */}
        {document.chapter_summary && (
          <div className="mt-8 p-4 rounded-2xl bg-[#FFFDF9] border border-amber-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5 font-sans">
              Chapter Summary & Key Takeaway
            </h4>
            <p className="text-xs sm:text-sm text-[#1C1A17] leading-relaxed">
              <TextWithMath text={document.chapter_summary} />
            </p>
          </div>
        )}

        {/* Revision Checklist */}
        {document.revision_checklist && document.revision_checklist.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2 font-sans flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Final Exam Revision Checklist</span>
            </h4>
            <div className="space-y-1 text-xs text-emerald-900">
              {document.revision_checklist.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Dispatcher for mapping typed blocks to their appropriate modular React components.
 */
function RenderContentBlock({ block, theme }) {
  if (!block) return null;

  switch (block.type) {
    case NOTE_CONTENT_TYPES.DEFINITION:
      return <DefinitionBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.FORMULA:
      return <FormulaBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.DERIVATION:
      return <DerivationBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.COMPARISON_TABLE:
      return <ComparisonTableBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.SOLVED_NUMERICAL:
      return <NumericalBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.EXAM_QUESTION:
      return <ExamQuestionBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.WARNING:
      return <WarningBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.IMPORTANT_POINT:
      return <ImportantPointBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.DIAGRAM:
    case NOTE_CONTENT_TYPES.FLOWCHART:
      return <DiagramBlock data={block} theme={theme} />;

    case NOTE_CONTENT_TYPES.SUBSECTION_HEADING:
      return (
        <h3 className="text-sm sm:text-base font-bold text-[#1C1A17] mt-3 mb-1">
          {block.content}
        </h3>
      );

    case NOTE_CONTENT_TYPES.BULLET_LIST:
      return (
        <div className="my-2 space-y-1 pl-2">
          {block.title && <strong className="text-xs block text-[#1C1A17]">{block.title}</strong>}
          {block.items?.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#1C1A17]">
              <span className="text-teal-600 font-bold select-none">•</span>
              <span><TextWithMath text={item} /></span>
            </div>
          ))}
        </div>
      );

    case NOTE_CONTENT_TYPES.NUMBERED_LIST:
      return (
        <div className="my-2 space-y-1 pl-2">
          {block.title && <strong className="text-xs block text-[#1C1A17]">{block.title}</strong>}
          {block.items?.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#1C1A17]">
              <span className="text-teal-600 font-bold font-mono text-xs select-none">{i + 1}.</span>
              <span><TextWithMath text={item} /></span>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <p className="text-xs sm:text-sm leading-relaxed text-[#1C1A17]/90 my-2">
          <TextWithMath text={block.content || block.text || ''} />
        </p>
      );
  }
}
