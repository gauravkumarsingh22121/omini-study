import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { validateAndNormalizeNotes } from './notesValidator';
import { DETAIL_LEVELS } from './notesSchema';

const geminiApiKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : process.env.VITE_GEMINI_API_KEY;
const groqApiKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : process.env.VITE_GROQ_API_KEY;

const client = new GoogleGenAI({ apiKey: geminiApiKey || 'placeholder' });
const groqClient = new Groq({ apiKey: groqApiKey || 'placeholder', dangerouslyAllowBrowser: true });

/**
 * Stage 1: Document Structure & Topic Analysis
 * Extracts chapter titles, main headings, subtopics, definitions, and constructs a coverage checklist.
 */
export async function analyzeDocumentStructure(documentText, documentTitle = 'Chapter') {
  const prompt = `You are a university academic researcher and curriculum specialist.
Analyze the following educational material or PDF chapter and produce a structured content outline.

Document Title: "${documentTitle}"
Content:
"""
${documentText ? documentText.slice(0, 18000) : 'Educational Material'}
"""

Return a clean JSON object with:
{
  "chapter_title": "${documentTitle}",
  "subject": "Main academic subject / domain",
  "estimated_reading_time": "Estimated reading time (e.g. 35 mins)",
  "coverage_checklist": [
    "Topic 1: Exact title & scope",
    "Topic 2: Exact title & scope",
    "Topic 3: Formulas & derivations",
    "Topic 4: Practical applications & exam focus"
  ],
  "sections_to_generate": [
    { "id": "sec-1", "title": "Heading 1", "importance": "HIGH" },
    { "id": "sec-2", "title": "Heading 2", "importance": "HIGH" },
    { "id": "sec-3", "title": "Heading 3", "importance": "MEDIUM" }
  ]
}

Return ONLY valid JSON.`;

  try {
    if (groqApiKey && groqApiKey !== 'placeholder') {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        response_format: { type: 'json_object' },
        temperature: 0.2
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.chapter_title && parsed.coverage_checklist) return parsed;
    }
  } catch (err) {
    console.warn("Groq document analysis fallback:", err);
  }

  try {
    if (geminiApiKey && geminiApiKey !== 'placeholder') {
      const interaction = await client.interactions.create({
        model: 'gemini-3.8-flash',
        input: prompt,
        response_format: { type: 'text', mime_type: 'application/json' }
      });
      const parsed = JSON.parse(interaction.output_text || '{}');
      if (parsed.chapter_title) return parsed;
    }
  } catch (err) {
    console.warn("Gemini document analysis fallback:", err);
  }

  // Graceful fallback outline
  return {
    chapter_title: documentTitle,
    subject: 'Academic Study',
    estimated_reading_time: '30 mins',
    coverage_checklist: [
      `Complete core theories of ${documentTitle}`,
      'Fundamental definitions and terminology',
      'Mathematical formulas, principles, and laws',
      'Practical examples, diagrams, and exam preparation'
    ],
    sections_to_generate: [
      { id: 'sec-1', title: 'Fundamental Concepts & Definitions', importance: 'HIGH' },
      { id: 'sec-2', title: 'Principles, Laws & Formulas', importance: 'HIGH' },
      { id: 'sec-3', title: 'Examination Questions & Applications', importance: 'HIGH' }
    ]
  };
}

/**
 * Stage 2: Structured Educational Notes Generation Engine
 * Generates the complete, unconstrained typed JSON document using the university master prompt.
 */
export async function generateStructuredNotes({
  documentText,
  documentTitle = 'Study Chapter',
  detailLevel = DETAIL_LEVELS.DETAILED,
  onProgress = null
}) {
  // Step 1: Document Analysis
  if (onProgress) onProgress({ stage: 'analyzing', message: 'Analyzing chapter structure & topic coverage checklist...' });
  const analysis = await analyzeDocumentStructure(documentText, documentTitle);

  // Step 2: Formulate Structured Generation Prompt
  if (onProgress) onProgress({ stage: 'generating', message: 'Generating comprehensive typed educational content (definitions, formulas, derivations, exam questions)...' });

  const detailInstructions = {
    [DETAIL_LEVELS.QUICK]: 'Generate concise, high-yield study notes highlighting key formulas and exam points.',
    [DETAIL_LEVELS.STANDARD]: 'Generate balanced, comprehensive notes with thorough definitions and solved examples.',
    [DETAIL_LEVELS.DETAILED]: 'Generate deep, exhaustive university-level study notes covering all subtopics, step-by-step derivations, numerical problems, and exam questions.',
    [DETAIL_LEVELS.EXHAUSTIVE]: 'Generate complete chapter notes with exhaustive coverage of every theorem, assumption, derivation, comparison table, trap, and model exam answer.'
  }[detailLevel] || 'Generate deep, comprehensive study notes.';

  const prompt = `You are an expert university professor and professional study-notes creator.
Your task is to transform the provided chapter into a COMPREHENSIVE, STRUCTURED STUDY DOCUMENT.

DOCUMENT TITLE: "${documentTitle}"
DETAIL LEVEL: ${detailLevel} (${detailInstructions})

CONTENT TO COVER:
"""
${documentText ? documentText.slice(0, 26000) : 'Academic Material'}
"""

IMPORTANT ARCHITECTURAL RULE:
Do NOT return arbitrary free-form markdown paragraphs. Return a STRICT JSON DOCUMENT conforming to the typed schema below.
The React application will parse every typed block and render it visually with handwritten notebook styling, KaTeX math, tables, diagrams, and exam blocks.

TYPED BLOCK TYPES:
- "paragraph": { "type": "paragraph", "content": "Detailed text..." }
- "definition": { "type": "definition", "title": "Term Name", "content": "Clear definition...", "importance": "HIGH" }
- "formula": { "type": "formula", "title": "Formula Name", "latex": "E = mc^2", "explanation": "Brief explanation", "variables": [{ "symbol": "E", "meaning": "Energy" }] }
- "derivation": { "type": "derivation", "title": "Derivation Title", "objective": "What is proved", "steps": ["Step 1 with math", "Step 2 with math"], "final_formula": "p = q \\\\times 2a" }
- "comparison_table": { "type": "comparison_table", "title": "Comparison Title", "headers": ["Basis", "Concept A", "Concept B"], "rows": [["Definition", "...", "..."], ["Unit", "...", "..."]] }
- "solved_numerical": { "type": "solved_numerical", "problem": "Question text", "given": ["q = 2C", "d = 0.5m"], "to_find": "Force", "solution_steps": ["Step 1...", "Step 2..."], "answer": "F = 10 N", "traps_to_avoid": "Watch out for unit conversion cm to m" }
- "exam_question": { "type": "exam_question", "marks": 5, "type_tag": "Expected Question", "question": "Explain ... in detail", "model_answer": "Complete structured model answer...", "key_points_to_include": ["Point 1", "Point 2"] }
- "warning": { "type": "warning", "title": "Common Exam Trap", "content": "Students often make this mistake..." }
- "important_point": { "type": "important_point", "title": "High-Yield Exam Point", "content": "Crucial concept..." }
- "diagram": { "type": "diagram", "title": "Diagram Title", "caption": "Diagram description", "diagram_type": "process", "elements": [{ "label": "Stage 1", "desc": "Details" }, { "label": "Stage 2", "desc": "Details" }] }
- "bullet_list": { "type": "bullet_list", "title": "Properties", "items": ["Item 1", "Item 2"] }

OUTPUT JSON SCHEMA:
{
  "chapter_title": "${documentTitle}",
  "subject": "${analysis.subject || 'Academic Studies'}",
  "estimated_reading_time": "${analysis.estimated_reading_time || '30 mins'}",
  "coverage_checklist": ${JSON.stringify(analysis.coverage_checklist || [])},
  "sections": [
    {
      "id": "sec-1",
      "title": "Section Title",
      "importance": "HIGH",
      "blocks": [
        // Typed blocks in logical educational sequence
      ]
    }
  ],
  "chapter_summary": "Comprehensive 3-paragraph summary of the entire chapter...",
  "formula_sheet": [
    { "title": "Formula Name", "latex": "Formula in LaTeX", "symbols": [{ "symbol": "x", "meaning": "Meaning" }] }
  ],
  "revision_checklist": [
    "Checklist point 1",
    "Checklist point 2"
  ]
}

Return ONLY valid JSON. Ensure all LaTeX backslashes are properly escaped (e.g. \\\\times, \\\\frac).`;

  let rawOutput = null;

  // Primary: Groq GPT-oss-120b with json_object response format
  try {
    if (groqApiKey && groqApiKey !== 'placeholder') {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        response_format: { type: 'json_object' },
        temperature: 0.25,
        max_tokens: 8192
      });
      rawOutput = completion.choices[0]?.message?.content;
    }
  } catch (err) {
    console.warn("Groq structured notes generation failed, trying fallback:", err);
  }

  // Fallback 1: Gemini interactions API
  if (!rawOutput && geminiApiKey && geminiApiKey !== 'placeholder') {
    try {
      const interaction = await client.interactions.create({
        model: 'gemini-3.8-flash',
        input: prompt,
        response_format: { type: 'text', mime_type: 'application/json' }
      });
      rawOutput = interaction?.output_text;
    } catch (gemErr) {
      console.warn("Gemini structured notes fallback failed:", gemErr);
    }
  }

  // Fallback 2: Groq Qwen 27B
  if (!rawOutput && groqApiKey && groqApiKey !== 'placeholder') {
    try {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'qwen/qwen3.8-27b',
        response_format: { type: 'json_object' },
        temperature: 0.25,
        max_tokens: 8192
      });
      rawOutput = completion.choices[0]?.message?.content;
    } catch (qwenErr) {
      console.error("All AI model attempts failed:", qwenErr);
    }
  }

  if (onProgress) onProgress({ stage: 'validating', message: 'Validating structured schema & formatting math equations...' });
  const validatedDocument = validateAndNormalizeNotes(rawOutput, documentTitle);

  if (onProgress) onProgress({ stage: 'completed', message: 'Notes generation completed successfully!' });
  return validatedDocument;
}
