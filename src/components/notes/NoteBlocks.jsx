import React from 'react';
import { MathRenderer, TextWithMath } from './MathRenderer';
import { 
  Sparkles, 
  AlertTriangle, 
  HelpCircle, 
  Calculator, 
  Lightbulb, 
  Table, 
  GitBranch, 
  CheckCircle2,
  Bookmark
} from 'lucide-react';

/**
 * 1. Definition Block
 */
export function DefinitionBlock({ data, theme }) {
  return (
    <div className={`my-3 p-4 rounded-2xl border transition-all ${
      theme === 'handwritten' 
        ? 'bg-amber-50/70 border-amber-300 shadow-2xs' 
        : theme === 'academic'
        ? 'bg-slate-50 border-slate-300 border-l-4 border-l-teal-600'
        : 'bg-emerald-50/60 border-emerald-300'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-teal-700" />
          <h4 className="font-bold text-sm text-[#1C1A17] tracking-wide">
            {data.title || 'Definition'}
          </h4>
        </div>
        {data.importance && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
            {data.importance}
          </span>
        )}
      </div>
      <p className="text-xs sm:text-sm leading-relaxed text-[#1C1A17]/90 pl-6">
        <TextWithMath text={data.content} />
      </p>
    </div>
  );
}

/**
 * 2. Formula Block with Variables Breakdown
 */
export function FormulaBlock({ data, theme }) {
  return (
    <div className={`my-3.5 p-4 rounded-2xl border ${
      theme === 'handwritten'
        ? 'bg-blue-50/60 border-blue-200 shadow-xs'
        : theme === 'academic'
        ? 'bg-white border-gray-300 shadow-xs'
        : 'bg-amber-50/50 border-amber-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-4 h-4 text-blue-600" />
        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 font-sans">
          {data.title || 'Key Formula'}
        </h4>
      </div>

      {/* Centered LaTeX Math */}
      <div className="py-2 px-4 rounded-xl bg-white border border-[#DDD8CB]/60 flex items-center justify-center my-1.5 overflow-x-auto">
        <MathRenderer latex={data.latex} inline={false} className="text-base sm:text-lg" />
      </div>

      {data.explanation && (
        <p className="text-xs text-[#525049] mt-1.5 italic">
          <TextWithMath text={data.explanation} />
        </p>
      )}

      {/* Variables List */}
      {data.variables && data.variables.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-blue-100/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
          {data.variables.map((v, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded text-[11px]">
                {v.symbol}
              </span>
              <span className="text-[#525049] text-[11px]">= {v.meaning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 3. Derivation Block
 */
export function DerivationBlock({ data, theme }) {
  return (
    <div className="my-3.5 p-4 rounded-2xl border border-purple-200 bg-purple-50/40">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-purple-700" />
        <h4 className="font-bold text-xs uppercase tracking-wider text-purple-900">
          Derivation: {data.title}
        </h4>
      </div>

      {data.objective && (
        <p className="text-xs font-semibold text-purple-950 mb-2">
          Objective: <span className="font-normal">{data.objective}</span>
        </p>
      )}

      {/* Step by step derivation */}
      <div className="space-y-2 pl-2 border-l-2 border-purple-300 my-2">
        {data.steps && data.steps.map((step, idx) => (
          <div key={idx} className="text-xs sm:text-sm text-[#1C1A17] flex items-start gap-2">
            <span className="text-purple-600 font-bold font-mono text-[11px] mt-0.5">({idx + 1})</span>
            <div className="flex-1">
              <TextWithMath text={step} />
            </div>
          </div>
        ))}
      </div>

      {data.final_formula && (
        <div className="mt-2.5 p-2 rounded-xl bg-white border border-purple-200 flex items-center justify-between text-xs">
          <span className="font-bold text-purple-900">Hence Proved:</span>
          <MathRenderer latex={data.final_formula} inline={true} />
        </div>
      )}
    </div>
  );
}

/**
 * 4. Comparison Table Component
 */
export function ComparisonTableBlock({ data }) {
  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-[#DDD8CB] bg-white shadow-xs">
      {data.title && (
        <div className="px-4 py-2 bg-gray-50 border-b border-[#DDD8CB] flex items-center gap-2">
          <Table className="w-3.5 h-3.5 text-gray-600" />
          <h4 className="font-bold text-xs text-[#1C1A17]">{data.title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF9F5] border-b border-[#DDD8CB] text-[#1C1A17] font-bold">
            <tr>
              {data.headers?.map((h, i) => (
                <th key={i} className="p-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDD8CB]/60">
            {data.rows?.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50/50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3 text-[#525049]">
                    <TextWithMath text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 5. Solved Numerical Block
 */
export function NumericalBlock({ data }) {
  return (
    <div className="my-3.5 p-4 rounded-2xl border border-teal-200 bg-teal-50/30">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-4 h-4 text-teal-700" />
        <span className="font-bold text-xs uppercase tracking-wider text-teal-900">Solved Numerical Problem</span>
      </div>

      <p className="text-xs sm:text-sm font-semibold text-[#1C1A17] mb-2.5">
        <TextWithMath text={data.problem} />
      </p>

      {data.given && data.given.length > 0 && (
        <div className="bg-white/90 p-2.5 rounded-xl border border-teal-100 mb-2 text-xs">
          <span className="font-bold text-teal-900 block mb-1">Given:</span>
          <div className="flex flex-wrap gap-2">
            {data.given.map((g, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-[#1C1A17] font-mono text-[11px]">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-1.5 pl-3 border-l-2 border-teal-300 text-xs text-[#525049] my-2">
        {data.solution_steps?.map((step, idx) => (
          <div key={idx}>
            <TextWithMath text={step} />
          </div>
        ))}
      </div>

      {data.answer && (
        <div className="mt-2.5 p-2 rounded-xl bg-emerald-100/70 text-emerald-950 font-bold text-xs flex items-center justify-between">
          <span>Final Answer:</span>
          <span className="font-mono text-sm">{data.answer}</span>
        </div>
      )}

      {data.traps_to_avoid && (
        <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
          ⚠️ <strong>Trap:</strong> {data.traps_to_avoid}
        </div>
      )}
    </div>
  );
}

/**
 * 6. Exam Question & Model Answer Block
 */
export function ExamQuestionBlock({ data }) {
  return (
    <div className="my-3.5 p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-700" />
          <span className="font-bold text-xs uppercase tracking-wider text-indigo-900">
            {data.type_tag || 'Expected University Question'}
          </span>
        </div>
        {data.marks && (
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px]">
            {data.marks} Marks
          </span>
        )}
      </div>

      <p className="font-bold text-xs sm:text-sm text-[#1C1A17] mb-2.5">
        Q: {data.question}
      </p>

      {/* Model Answer */}
      <div className="p-3 rounded-xl bg-white border border-indigo-100 text-xs sm:text-sm text-[#1C1A17] space-y-1.5">
        <span className="font-bold text-indigo-950 block text-[11px] uppercase tracking-wider">Model Answer:</span>
        <div className="leading-relaxed">
          <TextWithMath text={data.model_answer} />
        </div>
      </div>

      {data.key_points_to_include && data.key_points_to_include.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#525049]">
          <span className="font-bold text-indigo-900">Must include:</span>
          {data.key_points_to_include.map((pt, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-indigo-100 text-indigo-950">
              ✓ {pt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 7. Warning & Caution Block
 */
export function WarningBlock({ data }) {
  return (
    <div className="my-3 p-3.5 rounded-2xl border border-rose-200 bg-rose-50/60 text-rose-950 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
      <div className="space-y-0.5 text-xs sm:text-sm">
        <span className="font-bold block text-rose-900">{data.title || 'Common Exam Trap / Caution'}</span>
        <p className="leading-relaxed text-rose-900/90">
          <TextWithMath text={data.content} />
        </p>
      </div>
    </div>
  );
}

/**
 * 8. Important Exam Point Block
 */
export function ImportantPointBlock({ data }) {
  return (
    <div className="my-2.5 p-3 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-start gap-2.5 text-xs sm:text-sm">
      <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <strong className="text-amber-950 mr-1.5">★ {data.title || 'Exam Point'}:</strong>
        <span className="text-[#1C1A17]">
          <TextWithMath text={data.content} />
        </span>
      </div>
    </div>
  );
}

/**
 * 9. Structural Diagram & Flowchart Renderer
 */
export function DiagramBlock({ data }) {
  return (
    <div className="my-4 p-4 rounded-2xl border border-[#DDD8CB] bg-white shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#0D9488]" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#1C1A17]">{data.title || 'Diagram'}</h4>
        </div>
        {data.caption && <span className="text-[10px] text-gray-500 italic">{data.caption}</span>}
      </div>

      {/* Render elements as a visual flow graph */}
      {data.elements && data.elements.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2.5 p-4 bg-[#FAF9F5] rounded-xl border border-[#DDD8CB]/50 my-2">
          {data.elements.map((el, idx) => (
            <React.Fragment key={idx}>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-[#DDD8CB] shadow-xs text-center min-w-[100px]">
                <span className="font-bold text-xs text-[#1C1A17] block">{el.label || `Node ${idx + 1}`}</span>
                {el.desc && <span className="text-[10px] text-gray-500 block">{el.desc}</span>}
              </div>
              {idx < data.elements.length - 1 && (
                <span className="text-teal-600 font-bold text-sm">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : data.description ? (
        <div className="p-3 bg-gray-50 rounded-xl text-xs text-[#525049]">
          <TextWithMath text={data.description} />
        </div>
      ) : null}
    </div>
  );
}
