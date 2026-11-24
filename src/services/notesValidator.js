import { NOTE_CONTENT_TYPES } from './notesSchema';

/**
 * Validates and repairs the structured notes JSON object returned from the LLM.
 * Guarantees that the React Notes Renderer receives predictable, crash-proof data.
 */
export function validateAndNormalizeNotes(rawInput, fallbackTitle = 'University Study Notes') {
  let data = rawInput;

  // Handle string input
  if (typeof rawInput === 'string') {
    try {
      // Strip markdown code fences if model enclosed JSON in ```json ... ```
      const cleaned = rawInput
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      data = JSON.parse(cleaned);
    } catch {
      console.warn("JSON parse failed, attempting loose recovery on markdown text");
      return createFallbackDocumentFromMarkdown(rawInput, fallbackTitle);
    }
  }

  if (!data || typeof data !== 'object') {
    return createFallbackDocumentFromMarkdown(String(rawInput || ''), fallbackTitle);
  }

  // Normalize document header
  const normalized = {
    chapter_title: data.chapter_title || fallbackTitle,
    subject: data.subject || 'Academic Studies',
    estimated_reading_time: data.estimated_reading_time || '25-35 mins',
    coverage_checklist: Array.isArray(data.coverage_checklist) ? data.coverage_checklist : [],
    sections: [],
    chapter_summary: data.chapter_summary || '',
    formula_sheet: Array.isArray(data.formula_sheet) ? data.formula_sheet : [],
    revision_checklist: Array.isArray(data.revision_checklist) ? data.revision_checklist : []
  };

  // If sections array is present
  if (Array.isArray(data.sections) && data.sections.length > 0) {
    normalized.sections = data.sections.map((sec, idx) => ({
      id: sec.id || `sec-${idx + 1}`,
      title: sec.title || `Section ${idx + 1}`,
      importance: ['HIGH', 'MEDIUM', 'ADDITIONAL'].includes(sec.importance?.toUpperCase())
        ? sec.importance.toUpperCase()
        : 'MEDIUM',
      blocks: Array.isArray(sec.blocks) ? sec.blocks.map(normalizeBlock).filter(Boolean) : []
    }));
  } else if (Array.isArray(data.blocks)) {
    // Single-section fallback
    normalized.sections = [{
      id: 'sec-1',
      title: normalized.chapter_title,
      importance: 'HIGH',
      blocks: data.blocks.map(normalizeBlock).filter(Boolean)
    }];
  } else {
    // Fallback if empty
    normalized.sections = [{
      id: 'sec-1',
      title: normalized.chapter_title,
      importance: 'HIGH',
      blocks: [{
        type: NOTE_CONTENT_TYPES.PARAGRAPH,
        content: typeof data.content === 'string' ? data.content : 'Comprehensive study notes generated for examination review.'
      }]
    }];
  }

  return normalized;
}

function normalizeBlock(block) {
  if (!block || typeof block !== 'object') return null;

  const type = block.type || NOTE_CONTENT_TYPES.PARAGRAPH;

  switch (type) {
    case NOTE_CONTENT_TYPES.DEFINITION:
      return {
        type: NOTE_CONTENT_TYPES.DEFINITION,
        title: block.title || 'Definition',
        content: block.content || block.text || '',
        importance: block.importance || 'HIGH',
        source_pages: Array.isArray(block.source_pages) ? block.source_pages : []
      };

    case NOTE_CONTENT_TYPES.FORMULA:
      return {
        type: NOTE_CONTENT_TYPES.FORMULA,
        title: block.title || 'Formula',
        latex: block.latex || block.formula || '',
        explanation: block.explanation || '',
        variables: Array.isArray(block.variables) ? block.variables : []
      };

    case NOTE_CONTENT_TYPES.DERIVATION:
      return {
        type: NOTE_CONTENT_TYPES.DERIVATION,
        title: block.title || 'Derivation',
        objective: block.objective || '',
        assumptions: Array.isArray(block.assumptions) ? block.assumptions : [],
        steps: Array.isArray(block.steps) ? block.steps : [],
        final_formula: block.final_formula || ''
      };

    case NOTE_CONTENT_TYPES.COMPARISON_TABLE:
      return {
        type: NOTE_CONTENT_TYPES.COMPARISON_TABLE,
        title: block.title || 'Comparison Table',
        headers: Array.isArray(block.headers) ? block.headers : ['Feature', 'Category A', 'Category B'],
        rows: Array.isArray(block.rows) ? block.rows : []
      };

    case NOTE_CONTENT_TYPES.SOLVED_NUMERICAL:
      return {
        type: NOTE_CONTENT_TYPES.SOLVED_NUMERICAL,
        problem: block.problem || '',
        given: Array.isArray(block.given) ? block.given : [],
        to_find: block.to_find || '',
        solution_steps: Array.isArray(block.solution_steps) ? block.solution_steps : [],
        answer: block.answer || '',
        traps_to_avoid: block.traps_to_avoid || ''
      };

    case NOTE_CONTENT_TYPES.EXAM_QUESTION:
      return {
        type: NOTE_CONTENT_TYPES.EXAM_QUESTION,
        marks: block.marks || 5,
        type_tag: block.type_tag || 'Expected Question', // 'PYQ' | 'Expected' | 'Practice'
        question: block.question || '',
        model_answer: block.model_answer || '',
        key_points_to_include: Array.isArray(block.key_points_to_include) ? block.key_points_to_include : []
      };

    case NOTE_CONTENT_TYPES.DIAGRAM:
    case NOTE_CONTENT_TYPES.FLOWCHART:
      return {
        type: type,
        title: block.title || 'Diagram',
        caption: block.caption || '',
        diagram_type: block.diagram_type || 'process', // 'svg_flow' | 'mermaid' | 'ascii' | 'concept_tree'
        elements: Array.isArray(block.elements) ? block.elements : [],
        description: block.description || ''
      };

    case NOTE_CONTENT_TYPES.WARNING:
      return {
        type: NOTE_CONTENT_TYPES.WARNING,
        title: block.title || 'Caution / Common Exam Trap',
        content: block.content || block.text || ''
      };

    case NOTE_CONTENT_TYPES.IMPORTANT_POINT:
      return {
        type: NOTE_CONTENT_TYPES.IMPORTANT_POINT,
        title: block.title || 'Key Exam Point',
        content: block.content || block.text || ''
      };

    case NOTE_CONTENT_TYPES.BULLET_LIST:
      return {
        type: NOTE_CONTENT_TYPES.BULLET_LIST,
        title: block.title || '',
        items: Array.isArray(block.items) ? block.items : []
      };

    case NOTE_CONTENT_TYPES.NUMBERED_LIST:
      return {
        type: NOTE_CONTENT_TYPES.NUMBERED_LIST,
        title: block.title || '',
        items: Array.isArray(block.items) ? block.items : []
      };

    case NOTE_CONTENT_TYPES.EXAMPLE:
      return {
        type: NOTE_CONTENT_TYPES.EXAMPLE,
        title: block.title || 'Real-World Example',
        content: block.content || block.text || ''
      };

    default:
      return {
        type: NOTE_CONTENT_TYPES.PARAGRAPH,
        content: block.content || block.text || (typeof block === 'string' ? block : '')
      };
  }
}

/**
 * Recovers arbitrary markdown text into a valid structured document
 * so that even if the AI outputs markdown fallback, it renders through
 * the modular React Notes Renderer seamlessly.
 */
function createFallbackDocumentFromMarkdown(text, fallbackTitle) {
  const lines = text.split('\n');
  const sections = [];
  let currentSection = {
    id: 'sec-1',
    title: fallbackTitle,
    importance: 'HIGH',
    blocks: []
  };

  let bufferParagraph = [];

  const flushParagraph = () => {
    if (bufferParagraph.length > 0) {
      currentSection.blocks.push({
        type: NOTE_CONTENT_TYPES.PARAGRAPH,
        content: bufferParagraph.join(' ')
      });
      bufferParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Heading 1 or 2 -> Section
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
      flushParagraph();
      if (currentSection.blocks.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        id: `sec-${sections.length + 1}`,
        title: trimmed.replace(/^#+\s*/, ''),
        importance: trimmed.includes('HIGH') ? 'HIGH' : 'MEDIUM',
        blocks: []
      };
      continue;
    }

    // Heading 3 -> Subheading or definition
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      currentSection.blocks.push({
        type: NOTE_CONTENT_TYPES.SUBSECTION_HEADING,
        content: trimmed.replace(/^###\s*/, '')
      });
      continue;
    }

    // Bullet point
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      currentSection.blocks.push({
        type: NOTE_CONTENT_TYPES.BULLET_LIST,
        items: [trimmed.replace(/^[-*]\s*/, '')]
      });
      continue;
    }

    // Warning
    if (trimmed.includes('⚠') || trimmed.toLowerCase().includes('warning') || trimmed.toLowerCase().includes('common mistake')) {
      flushParagraph();
      currentSection.blocks.push({
        type: NOTE_CONTENT_TYPES.WARNING,
        title: 'Common Exam Trap / Caution',
        content: trimmed
      });
      continue;
    }

    // Star point
    if (trimmed.includes('★') || trimmed.toLowerCase().includes('exam point')) {
      flushParagraph();
      currentSection.blocks.push({
        type: NOTE_CONTENT_TYPES.IMPORTANT_POINT,
        title: 'High-Yield Exam Point',
        content: trimmed
      });
      continue;
    }

    bufferParagraph.push(trimmed);
  }

  flushParagraph();
  if (currentSection.blocks.length > 0) {
    sections.push(currentSection);
  }

  return {
    chapter_title: fallbackTitle,
    subject: 'Academic Notes',
    estimated_reading_time: '20-30 mins',
    coverage_checklist: ['Complete Chapter Overview', 'Core Theoretical Definitions', 'Formulas & Exam Focus'],
    sections: sections.length > 0 ? sections : [{
      id: 'sec-1',
      title: fallbackTitle,
      importance: 'HIGH',
      blocks: [{ type: NOTE_CONTENT_TYPES.PARAGRAPH, content: text }]
    }],
    chapter_summary: 'Comprehensive structured study notes compiled from chapter material.',
    formula_sheet: [],
    revision_checklist: ['Review all highlighted definitions', 'Practice numerical derivations', 'Review exam traps']
  };
}
