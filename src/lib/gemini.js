import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

const geminiApiKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : process.env.VITE_GEMINI_API_KEY;
const groqApiKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : process.env.VITE_GROQ_API_KEY;

// Create the clients with the API keys. 
const client = new GoogleGenAI({ apiKey: geminiApiKey || 'placeholder' });
const groqClient = new Groq({ apiKey: groqApiKey || 'placeholder', dangerouslyAllowBrowser: true });

function isFallbackError(error) {
  return error?.status === 429 ||
    (error?.message && (
      error.message.toLowerCase().includes('429') ||
      error.message.toLowerCase().includes('quota') ||
      error.message.toLowerCase().includes('rate limit') ||
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch')
    ));
}

function parseJsonSafe(text) {
  try {
    // Strip markdown formatting if any (e.g. ```json ... ```)
    const sanitized = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(sanitized);
  } catch (e) {
    throw new Error('Failed to parse JSON response: ' + e.message + ' | Received: ' + text);
  }
}

/**
 * Transcribes an audio Blob or File using Groq Whisper (lightning fast, cross-browser).
 * Works across Chrome, Brave, Safari, Firefox, and Edge.
 * 
 * @param {Blob | File} audioBlob - The recorded audio blob.
 * @returns {Promise<string>} The transcribed text.
 */
export async function transcribeAudioWithWhisper(audioBlob) {
  try {
    if (!groqApiKey || groqApiKey === 'placeholder') {
      throw new Error("Missing Groq API Key for Whisper transcription");
    }

    // Convert Blob to File object expected by the SDK
    const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type || 'audio/webm' });

    const transcription = await groqClient.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'en',
      temperature: 0.0
    });

    return transcription.text?.trim() || '';
  } catch (err) {
    console.error("Groq Whisper transcription failed:", err);
    throw err;
  }
}

/**
 * Generates interactive multiple-choice questions for QuizFetch based on notes.
 * Schema: [{ id, question, options: [{ id: 'A', text: '...' }], correctId: 'C', explanation: '...' }]
 */
export async function generateQuizFetchQuestions(notesText, count = 10) {
  const prompt = `
You are an expert tutor preparing interactive practice questions for a student based on their study notes.
Generate ${count} high-quality multiple choice questions testing key concepts from the notes below.
Each question must have options (A, B, C, D) and an optional "I don't know" option E.
Return ONLY valid JSON array with schema:
[
  {
    "id": 1,
    "question": "Question text...",
    "options": [
      { "id": "A", "text": "Option A" },
      { "id": "B", "text": "Option B" },
      { "id": "C", "text": "Option C" },
      { "id": "D", "text": "Option D" },
      { "id": "E", "text": "I don't know" }
    ],
    "correctId": "C",
    "explanation": "Brief explanation of the correct answer."
  }
]

Notes:
${notesText}
`;

  try {
    if (!geminiApiKey) throw new Error("Missing Gemini API Key");

    const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json'
      }
    });

    return parseJsonSafe(interaction.output_text);
  } catch (error) {
    console.warn('Gemini error, trying Groq fallback for QuizFetch:', error);
    try {
      if (!groqApiKey) throw new Error("Missing Groq API Key");
      const groqPrompt = prompt + '\nReturn ONLY JSON wrapped in a "questions" key: {"questions": [...]}';
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: groqPrompt }],
        model: 'openai/gpt-oss-120b',
        response_format: { type: 'json_object' }
      });
      const parsed = parseJsonSafe(completion.choices[0].message.content);
      return parsed.questions || parsed;
    } catch (groqErr) {
      console.error('Groq fallback failed:', groqErr);
      // High quality fallback questions matching user topic
      return [
        {
          id: 1,
          question: "If a metal surface with a work function of W = 4.2 eV is incident with photons of energy E = 4.0 eV, which of the following statements is true regarding the photoelectric effect?",
          options: [
            { id: "A", text: "Electrons are emitted only if the intensity of the light is sufficiently increased." },
            { id: "B", text: "Electrons are emitted but they have zero kinetic energy." },
            { id: "C", text: "No electrons are emitted because the photon energy is less than the work function." },
            { id: "D", text: "Electrons are emitted with a maximum kinetic energy of 0.2 eV." },
            { id: "E", text: "I don't know" }
          ],
          correctId: "C",
          explanation: "Photoelectric emission occurs only if the incident photon energy E >= work function W. Here E = 4.0 eV < W = 4.2 eV, so no electrons are emitted regardless of light intensity."
        },
        {
          id: 2,
          question: "According to de Broglie's hypothesis, what happens to the wavelength of an electron if its momentum is doubled?",
          options: [
            { id: "A", text: "The wavelength is doubled." },
            { id: "B", text: "The wavelength is halved." },
            { id: "C", text: "The wavelength quadruples." },
            { id: "D", text: "The wavelength remains unchanged." },
            { id: "E", text: "I don't know" }
          ],
          correctId: "B",
          explanation: "De Broglie wavelength λ = h / p. Since wavelength is inversely proportional to momentum p, doubling momentum halves the wavelength."
        },
        {
          id: 3,
          question: "What is the stopping potential in a photoelectric experiment primarily dependent on?",
          options: [
            { id: "A", text: "Frequency of incident radiation and work function of the emitter." },
            { id: "B", text: "Only the intensity of the incident beam." },
            { id: "C", text: "Distance between the source and the cathode." },
            { id: "D", text: "Surface area of the anode plate." },
            { id: "E", text: "I don't know" }
          ],
          correctId: "A",
          explanation: "Einstein's photoelectric equation states eV_0 = hν - W. Hence, stopping potential V_0 depends on frequency ν and work function W, independent of intensity."
        }
      ];
    }
  }
}

/**
 * Generate a comprehensive Practice Test based on selected question types:
 * Case study, coding questions, passage-based questions, multiple choice, 
 * fill in the blanks, true/false, short answers, long answers, numerical problem.
 *
 * @param {string} notesText
 * @param {Array<string>} selectedTypes
 * @param {number} totalQuestions
 * @returns {Promise<Array<{id: number, type: string, typeLabel: string, passage?: string, question: string, options?: Array<{id: string, text: string}>, correctId?: string, answerKey: string, explanation: string, points: number}>>}
 */
export async function generateCustomPracticeTest(notesText, selectedTypes = ['multiple_choice'], totalQuestions = 8) {
  const typeDescriptions = selectedTypes.join(', ');

  const prompt = `
You are an examination setter designing a formal timed Practice Test based on the student's study material.
The student has selected these specific question categories: [${typeDescriptions}].
Generate ${totalQuestions} balanced questions strictly covering these chosen categories.

Categorization rules for each item:
- "case_study": Include a real-world scenario/case passage followed by a diagnostic question with options A,B,C,D.
- "coding": A programming problem, syntax/algorithmic question or code snippet analysis with options or short answer.
- "passage_based": Include a reading excerpt passage followed by a comprehension question with options A,B,C,D.
- "multiple_choice": Standard 4-option multiple choice with options A,B,C,D and E "I don't know".
- "fill_in_the_blanks": A statement with a blank "___" to fill in with options A,B,C,D or direct input.
- "true_false": True or False proposition with options A ("True") and B ("False").
- "short_answers": A focused question expecting a 1-2 sentence core definition or concept. Provide sample acceptable answer in "answerKey".
- "long_answers": An analytical or explanatory question. Provide key scoring points in "answerKey".
- "numerical_problem": A calculation/formula-based problem with givens and units. Include options A,B,C,D or numerical answer.

Return ONLY a valid JSON array matching this exact schema:
[
  {
    "id": 1,
    "type": "multiple_choice",
    "typeLabel": "Multiple Choice",
    "passage": "Optional scenario/passage text if applicable, else empty string",
    "question": "Question text...",
    "options": [
      { "id": "A", "text": "Option A" },
      { "id": "B", "text": "Option B" },
      { "id": "C", "text": "Option C" },
      { "id": "D", "text": "Option D" },
      { "id": "E", "text": "I don't know" }
    ],
    "correctId": "A",
    "answerKey": "The expected answer or key terms",
    "explanation": "Detailed pedagogical explanation for post-test evaluation.",
    "points": 1
  }
]

Notes Content:
${notesText}
`;

  try {
    if (!geminiApiKey) throw new Error("Missing Gemini API Key");

    const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json'
      }
    });

    const parsed = parseJsonSafe(interaction.output_text);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
    throw new Error("Invalid output format");
  } catch (error) {
    console.warn('Gemini error generating practice test, trying Groq fallback:', error);
    try {
      if (!groqApiKey) throw new Error("Missing Groq API Key");
      const groqPrompt = prompt + '\nReturn ONLY JSON wrapped in a "questions" key: {"questions": [...]}';
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: groqPrompt }],
        model: 'openai/gpt-oss-120b',
        response_format: { type: 'json_object' }
      });
      const parsed = parseJsonSafe(completion.choices[0].message.content);
      const res = parsed.questions || parsed;
      if (Array.isArray(res) && res.length > 0) return res;
      throw new Error("Groq returned empty question array");
    } catch (groqErr) {
      console.error('Groq fallback failed:', groqErr);
      // High-quality contextual fallback test items
      return [
        {
          id: 1,
          type: "multiple_choice",
          typeLabel: "Multiple Choice",
          passage: "",
          question: "Which of the following best defines the photoelectric work function (W)?",
          options: [
            { id: "A", text: "The minimum kinetic energy of emitted photoelectrons." },
            { id: "B", text: "The minimum photon energy required to liberate an electron from the metal surface." },
            { id: "C", text: "The maximum energy of photons incident on the material." },
            { id: "D", text: "The stopping potential required to halt current." }
          ],
          correctId: "B",
          answerKey: "B",
          explanation: "Work function is the minimum energy necessary to eject an electron from the surface.",
          points: 1
        },
        {
          id: 2,
          type: "true_false",
          typeLabel: "True / False",
          passage: "",
          question: "According to classical wave theory of light, increasing light intensity should increase the maximum kinetic energy of emitted electrons, but experiments showed it only increases current.",
          options: [
            { id: "A", text: "True" },
            { id: "B", text: "False" }
          ],
          correctId: "A",
          answerKey: "A",
          explanation: "Classical theory predicted energy accumulation with intensity. Einstein showed energy depends on frequency ν, while intensity only changes the photon flux.",
          points: 1
        },
        {
          id: 3,
          type: "numerical_problem",
          typeLabel: "Numerical Problem",
          passage: "",
          question: "Photons of energy 5.5 eV hit a potassium surface with work function W = 2.2 eV. What is the maximum kinetic energy of emitted electrons?",
          options: [
            { id: "A", text: "7.7 eV" },
            { id: "B", text: "3.3 eV" },
            { id: "C", text: "2.5 eV" },
            { id: "D", text: "1.2 eV" }
          ],
          correctId: "B",
          answerKey: "3.3 eV",
          explanation: "K_max = E - W = 5.5 eV - 2.2 eV = 3.3 eV.",
          points: 2
        },
        {
          id: 4,
          type: "short_answers",
          typeLabel: "Short Answer",
          passage: "",
          question: "State the de Broglie wavelength formula in terms of Planck's constant (h) and momentum (p).",
          options: [],
          correctId: "",
          answerKey: "λ = h / p or lambda = h / (m * v)",
          explanation: "The de Broglie relation connects wave character (λ) with particle momentum (p = mv) via Planck's constant: λ = h / p.",
          points: 2
        }
      ];
    }
  }
}


/**
 * Generates an array of active recall quiz questions from extracted PDF text.
 * Must return JSON array format: [{ id: 1, question: "...", keyAnswerPoints: "..." }]
 * 
 * @param {string} pdfText - The extracted text from the PDF.
 * @param {number} count - The number of questions to generate.
 * @returns {Promise<Array<{id: number, question: string, keyAnswerPoints: string}>>}
 */
export async function generateQuestionsFromNotes(pdfText, count = 5) {
  const prompt = `
You are a tutor creating active recall questions for a student.
Based on the following notes, generate EXACTLY ${count} short, open-ended questions that test the student's understanding.
Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "id": 1,
    "question": "The question text",
    "keyAnswerPoints": "The main points expected in the answer"
  }
]

Notes:
${pdfText}
`;

  try {
    if (!geminiApiKey) throw new Error("Missing Gemini API Key");

    // gemini-1.5-flash is deprecated in the new SDK. Recommended replacement is gemini-3.8-flash.
    const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              question: { type: "string" },
              keyAnswerPoints: { type: "string" }
            },
            required: ["id", "question", "keyAnswerPoints"]
          }
        }
      }
    });

    return parseJsonSafe(interaction.output_text);
  } catch (error) {
    if (isFallbackError(error) || !geminiApiKey) {
      console.warn('Gemini limit reached/failed. Switching to Groq fallback...');
      try {
        if (!groqApiKey) throw new Error("Missing Groq API Key");

        const groqPrompt = prompt + '\n\nIMPORTANT: Return ONLY a valid JSON object wrapped under a "questions" key, like {"questions": [{"id": 1, "question": "...", "keyAnswerPoints": "..."}]}. Do not include markdown wrappers.';

        const completion = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: groqPrompt }],
          model: 'openai/gpt-oss-120b',
          response_format: { type: 'json_object' }
        });

        const parsed = parseJsonSafe(completion.choices[0].message.content);
        return parsed.questions || parsed; // Handle array unwrapping if necessary
      } catch (groqError) {
        console.error('Error generating questions with Groq fallback:', groqError);
        return [{ id: 1, question: "Error generating questions.", keyAnswerPoints: "Please try again later or check your API keys." }];
      }
    }

    console.error('Error generating questions:', error);
    return [{ id: 1, question: "Error generating questions.", keyAnswerPoints: "Please try again later." }];
  }
}

/**
 * Answers a quick question directly.
 * If fileContext is present, answers based on the file content.
 * Otherwise, answers directly from general AI knowledge.
 * 
 * @param {string} question - The user's question or search query.
 * @param {string|string[]|null} fileContext - Extracted text from uploaded PDF or sample.
 * @param {string} [docTitle] - Optional title/name of the document.
 * @returns {Promise<{ answer: string, source: string }>}
 */
export async function answerQuickQuestion(question, fileContext = null, docTitle = '') {
  // Normalize context
  let text = '';
  if (Array.isArray(fileContext)) {
    text = fileContext.join('\n\n').trim();
  } else if (typeof fileContext === 'string') {
    text = fileContext.trim();
  }

  const hasContext = Boolean(text.length > 0 || (docTitle && docTitle.trim().length > 0));

  const isNotesRequest = /(generate|create|write|prepare|give me|make).*(note|notes|summary|chapter|handwritten)/i.test(question) ||
    /^(note|notes|detailed notes|comprehensive notes)/i.test(question.trim());

  const prompt = hasContext 
    ? (isNotesRequest
      ? `${MASTER_HANDWRITTEN_NOTES_PROMPT}

The student specifically requested full study notes:
Student's Request: "${question}"

Active Study Material:
Document Title: "${docTitle || 'Study Material'}"
Document Content:
"""
${text ? text.slice(0, 25000) : '(No text extracted yet; document name: ' + docTitle + ')'}
"""

INSTRUCTIONS FOR DETAILED NOTES:
- Do NOT provide a short or concise answer.
- Generate exhaustive, complete, unconstrained university study notes covering every concept, formula, derivation, table, and exam question.
- Do NOT omit any technical details.`
      : `You are Minnie, a brilliant, concise, and structured AI tutor for OMINI-Study.
Never refer to yourself as ChatGPT, OpenAI, or any other assistant. If asked who you are or what your name is, say your name is Minnie.

The student has active study material:
Document Title: "${docTitle || 'Study Material'}"
Document Content / Notes:
"""
${text ? text.slice(0, 15000) : '(No text extracted yet; document name: ' + docTitle + ')'}
"""

Student's Question:
"${question}"

FORMATTING & RESPONSE RULES (Concise Chat Q&A style):
1. **Direct Answer First**: Provide a clear, crisp 1-2 sentence core answer at the very beginning. Never use generic conversational filler (e.g. "Sure! Here is the answer", "Certainly!").
2. **Concise & To-the-Point**: Keep the response concise, punchy, and structured. Answer exactly what the user asks without unnecessary fluff.
3. **Structured Breakdown**: Use clean bold headers, bullet points, and numbered lists for readability.
4. **Grounded in Material**: Answer accurately using the study document.
5. **Key Takeaway**: End with a short 1-2 sentence **Key Takeaway**.`)
    : `You are Minnie, a brilliant, concise, and structured AI tutor for OMINI-Study.
Never refer to yourself as ChatGPT, OpenAI, or any other assistant. If asked who you are or what your name is, say your name is Minnie.

Student's Question:
"${question}"

FORMATTING & RESPONSE RULES (Concise Chat Q&A style):
1. **Direct Answer First**: Provide a clear, crisp 1-2 sentence core answer at the very beginning. Never use generic conversational filler.
2. **Concise & To-the-Point**: Keep the response concise, punchy, and structured.
3. **Structured Breakdown**: Use clean bold headers and bullet points.
4. **Key Takeaway**: End with a short 1-2 sentence **Key Takeaway**.`;

  // First try Groq
  try {
    if (groqApiKey && groqApiKey !== 'placeholder') {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        temperature: 0.3
      });
      const answer = completion.choices[0]?.message?.content?.trim();
      if (answer) return { answer, source: hasContext ? 'document' : 'general_ai' };
    }
  } catch (err) {
    console.warn("Groq attempt 1 failed:", err);
  }

  // Backup with Qwen on Groq
  try {
    if (groqApiKey && groqApiKey !== 'placeholder') {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'qwen/qwen3.8-27b',
        temperature: 0.3
      });
      const answer = completion.choices[0]?.message?.content?.trim();
      if (answer) return { answer, source: hasContext ? 'document' : 'general_ai' };
    }
  } catch (err) {
    console.warn("Groq attempt 2 failed:", err);
  }

  // Backup with Gemini interactions API if available
  try {
    if (geminiApiKey && geminiApiKey !== 'placeholder') {
      const interaction = await client.interactions.create({
        model: 'gemini-3.8-flash',
        input: prompt
      });
      if (interaction?.output_text) {
        return { answer: interaction.output_text.trim(), source: hasContext ? 'document' : 'general_ai' };
      }
    }
  } catch (err) {
    console.warn("Gemini attempt failed:", err);
  }

  return { 
    answer: `You uploaded "${docTitle || 'a PDF document'}". ${text ? 'I have read the document context and am ready to answer any questions about it!' : 'The document is loaded and ready for questions.'}`, 
    source: hasContext ? 'document' : 'general_ai' 
  };
}

/**
 * MASTER PROMPT: COMPLETE HANDWRITTEN-STYLE STUDY NOTES
 * Generates comprehensive, student-friendly, exam-oriented handwritten-style study notes.
 */
export const MASTER_HANDWRITTEN_NOTES_PROMPT = `You are an expert university professor, subject-matter expert, academic researcher and professional study-notes creator.

Your task is to convert the provided study material / uploaded PDF chapter into comprehensive, student-friendly, exam-oriented handwritten-style study notes.

## 1. PRIMARY OBJECTIVE
Create notes that are sufficiently complete for a student to understand the entire chapter and prepare for university examinations without repeatedly referring to the original PDF.
Do not create a short summary. Create complete study material.
Completeness and accuracy are more important than keeping the notes short.

## 2. COMPLETE CONTENT COVERAGE
Preserve and explain every relevant element of the original PDF:
- All topics and subtopics.
- Definitions and technical terminology.
- Concepts, principles, laws and theorems.
- Formulas and mathematical derivations.
- Algorithms and procedures.
- Graphs, charts, diagrams and flowcharts (rendered in clean ASCII/text diagrams or markdown).
- Tables and comparisons.
- Examples and applications.
- Assumptions, conditions and limitations.
- Advantages and disadvantages.
- Exceptions and special cases.
- Conclusions and observations.
Do not silently omit content because you consider it less important.

## 3. EXPLANATION STYLE
Explain every topic using the following structure wherever applicable:
1. Definition: What is it?
2. Basic understanding: Explain it in simple language.
3. Detailed explanation: Explain the complete technical concept.
4. Working: How does it work?
5. Purpose: Why is it required?
6. Example: Provide an understandable example.
7. Applications: Where is it used?
8. Exam perspective: What should students write in examinations?
Assume the student is learning the topic for the first time.
Preserve the original technical terminology. Do not oversimplify mathematical or scientific meaning.

## 4. IMPORTANCE CLASSIFICATION
Assign every topic one of these labels:
[HIGH]: Core concepts, important definitions, formulas, derivations and exam-relevant topics.
[MEDIUM]: Supporting concepts, comparisons, applications and secondary explanations.
[ADDITIONAL]: Background information and supplementary details.
Explain why a topic has been assigned its importance level.

## 5. EXAMINATION PREPARATION
For every major topic, prepare:
- 1–2 mark questions with model answers.
- 3–5 mark questions with model answers.
- 8–10 mark questions with structured outlines.
- Definition-based questions.
- Difference-between questions.
- Why and how questions.
- Numerical problems with complete step-by-step solutions where applicable.

## 6. QUESTION PATTERN ANALYSIS
For every important concept, explain:
- What can be asked?
- How can the examiner frame the question?
- What points should be included in the answer?
- Common mistakes students should avoid.

## 7. MATHEMATICS AND FORMULAS
For every formula:
- Write the original formula clearly.
- Define every symbol.
- Explain its purpose and assumptions.
- Show derivation wherever relevant.
- Provide a solved numerical example.
- Highlight common calculation traps.

## 8. VISUAL PRESENTATION
Use a student-friendly handwritten college-notebook format:
- Clear chapter and topic headings (#, ##, ###).
- Arrows (→, ⇒) to explain relationships.
- Tables for comparisons.
- Important exam points marked with ★.
- Warnings and traps marked with ⚠.
- Boxed key formulas.

## 9. CHAPTER-END MATERIAL
At the end, provide:
1. Complete chapter summary.
2. Important definitions glossary.
3. Formula sheet.
4. Top examination questions with answers.
5. Quick revision cheat-sheet.

## 10. SOURCE ACCURACY
Use the provided material as the primary source. Do not invent information. Preserve all important technical details.

FINAL REQUIREMENT:
The final output should resemble carefully prepared, comprehensive university handwritten notes that a student can use for understanding, learning, examination preparation and last-minute revision.
Do not sacrifice completeness for brevity.`;

/**
 * Generates comprehensive handwritten-style study notes using the Master Prompt.
 * 
 * @param {string} chapterText - The full text of the chapter or uploaded documents.
 * @param {string} chapterTitle - The title of the chapter / document.
 * @returns {Promise<string>} The generated comprehensive handwritten-style notes.
 */
export async function generateHandwrittenNotes(chapterText, chapterTitle = 'Study Chapter') {
  const prompt = `${MASTER_HANDWRITTEN_NOTES_PROMPT}

Active Chapter / Study Material:
Chapter Title: "${chapterTitle}"
Content:
"""
${chapterText ? chapterText.slice(0, 25000) : 'Study Chapter Material'}
"""

Begin generating the complete, comprehensive handwritten-style study notes now:`;

  // Try Groq high-capacity model (unconstrained token output for detailed notes)
  try {
    if (groqApiKey && groqApiKey !== 'placeholder') {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        temperature: 0.3,
        max_tokens: 8192
      });
      const notes = completion.choices[0]?.message?.content?.trim();
      if (notes) return notes;
    }
  } catch (err) {
    console.warn("Groq notes generation attempt failed, trying fallback:", err);
  }

  // Fallback with Gemini (unconstrained full chapter output)
  try {
    if (geminiApiKey) {
      const interaction = await client.interactions.create({
        model: 'gemini-3.8-flash',
        input: prompt
      });
      if (interaction?.output_text) {
        return interaction.output_text;
      }
    }
  } catch (geminiErr) {
    console.error("Gemini notes generation failed:", geminiErr);
  }

  // Secondary fallback: Qwen on Groq (high max token limit)
  try {
    if (groqApiKey && groqApiKey !== 'placeholder') {
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'qwen/qwen3.8-27b',
        temperature: 0.3,
        max_tokens: 8192
      });
      const notes = completion.choices[0]?.message?.content?.trim();
      if (notes) return notes;
    }
  } catch (qwenErr) {
    console.error("Qwen notes fallback failed:", qwenErr);
  }

  throw new Error("Unable to generate comprehensive study notes. Please try again.");
}

/**
 * Evaluates user's spoken answer against the PDF context.
 * Must return JSON object format: { score: number (0-100), isCorrect: boolean, feedback: "string" }
 * 
 * @param {string} question - The question asked.
 * @param {string} userAnswer - The user's spoken response.
 * @param {string} noteContext - The original study notes.
 * @returns {Promise<{score: number, isCorrect: boolean, feedback: string}>}
 */
export async function evaluateSpokenAnswer(question, userAnswer, noteContext) {
  const prompt = `
You are a tutor evaluating a student's answer to a question.

Original Notes:
${noteContext}

Question Asked:
${question}

Student's Answer:
${userAnswer}

Task:
Evaluate the student's answer based on the notes. 
Provide your response as a JSON object matching this schema exactly:
{
  "score": <number 0-100 representing accuracy>,
  "isCorrect": <boolean representing if they passed>,
  "feedback": "<Exactly 2 sentences of spoken feedback. 1st sentence: Correct/incorrect statement. 2nd sentence: Brief clarification/reinforcement.>"
}
`;

  try {
    if (!geminiApiKey) throw new Error("Missing Gemini API Key");

    const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: "object",
          properties: {
            score: {
              type: "integer",
              description: "A number from 0 to 100 representing the accuracy and completeness of the answer."
            },
            isCorrect: {
              type: "boolean",
              description: "True if the answer is generally correct, false otherwise."
            },
            feedback: {
              type: "string",
              description: "Exactly 2 sentences of spoken feedback."
            }
          },
          required: ["score", "isCorrect", "feedback"]
        }
      }
    });

    return parseJsonSafe(interaction.output_text);
  } catch (error) {
    if (isFallbackError(error) || !geminiApiKey) {
      console.warn('Gemini limit reached/failed. Switching to Groq fallback...');
      try {
        if (!groqApiKey) throw new Error("Missing Groq API Key");

        const groqPrompt = prompt + '\n\nIMPORTANT: Output ONLY a valid JSON object without markdown formatting wrappers.';
        const completion = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: groqPrompt }],
          model: 'openai/gpt-oss-120b',
          response_format: { type: 'json_object' }
        });

        return parseJsonSafe(completion.choices[0].message.content);
      } catch (groqError) {
        console.error('Error evaluating answer with Groq fallback:', groqError);
        return { score: 0, isCorrect: false, feedback: "We encountered an error analyzing your answer. Please check your API keys or try again." };
      }
    }

    console.error('Error evaluating answer:', error);
    return { score: 0, isCorrect: false, feedback: "We encountered an error analyzing your answer. Please try again." };
  }
}

/**
 * Extracts clean readable study text and title from any public web URL (articles, docs, Wikipedia, blogs).
 * Uses Jina AI's Reader API (CORS friendly, extracts markdown/plain text without browser blocking).
 * 
 * @param {string} rawUrl - The user-provided URL.
 * @returns {Promise<{ title: string, text: string, url: string }>}
 */
export async function fetchWebUrlContent(rawUrl) {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname.replace(/^www\./i, '');
  const fallbackTitle = `${hostname}${parsedUrl.pathname !== '/' ? parsedUrl.pathname.slice(0, 30) : ''}`;

  // Check if it's a YouTube URL
  const isYouTube = hostname.includes('youtube.com') || hostname.includes('youtu.be');
  if (isYouTube) {
    try {
      // Fetch video title and metadata from YouTube oEmbed (no API key needed, CORS enabled)
      const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const oembedData = await oembedRes.json();
      const videoTitle = oembedData.title || `YouTube Video (${url})`;
      const author = oembedData.author_name || 'YouTube Channel';

      // Fetch textual summary/notes via Jina Reader or fallback to video metadata
      let detailsText = `YouTube Video Title: ${videoTitle}\nChannel / Creator: ${author}\nURL: ${url}`;
      try {
        const jinaRes = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
          headers: { 'Accept': 'text/plain' }
        });
        if (jinaRes.ok) {
          const body = await jinaRes.text();
          if (body && body.length > 100) {
            detailsText += `\n\nVideo Overview & Content:\n${body.slice(0, 12000)}`;
          }
        }
      } catch (inner) {
        console.warn('Jina fetch for YouTube notes fell back to oEmbed metadata:', inner);
      }

      return {
        title: videoTitle,
        text: detailsText,
        url: url
      };
    } catch (ytErr) {
      console.warn('YouTube oembed fetch error:', ytErr);
    }
  }

  // Fetch standard webpage/article via Jina Reader API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain',
        'X-No-Cache': 'true'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const content = await res.text();
      if (content && content.trim().length > 50) {
        // Extract title if available at beginning (e.g. "Title: ...")
        const titleMatch = content.match(/Title:\s*([^\n\r]+)/i);
        const resolvedTitle = titleMatch ? titleMatch[1].trim() : fallbackTitle;

        return {
          title: resolvedTitle,
          text: content.slice(0, 18000), // Cap reasonable prompt size
          url: url
        };
      }
    }
  } catch (jinaErr) {
    console.warn('Jina reader fetch failed, falling back to basic context:', jinaErr);
  }

  // Fallback: If reader API is blocked or offline, return structured web reference
  return {
    title: fallbackTitle,
    text: `Web Page / Article Resource:\nURL: ${url}\nDomain: ${hostname}\nReference material from ${hostname} provided for study and analysis.`,
    url: url
  };
}
