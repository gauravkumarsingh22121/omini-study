import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractTextFromPDF } from '../lib/pdfReader';
import { answerQuickQuestion, generateQuizFetchQuestions, generateCustomPracticeTest, fetchWebUrlContent, generateHandwrittenNotes, MASTER_HANDWRITTEN_NOTES_PROMPT } from '../lib/gemini';
import { generateStructuredNotes } from '../services/notesGenerator';
import { NotesStudio } from '../components/notes/NotesStudio';
import { DETAIL_LEVELS, NOTE_THEMES } from '../services/notesSchema';
import { useWebSpeech } from '../hooks/useWebSpeech';
import {
  FileText,
  Upload,
  ArrowRight,
  Sparkles,
  Headphones,
  Image as ImageIcon,
  Plus,
  Mic,
  MicOff,
  CheckCircle2,
  Loader2,
  Send,
  X,
  Bot,
  Copy,
  Check,
  Paperclip,
  AlertCircle,
  Trash2,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  GripVertical,
  Search,
  Folder,
  Calendar,
  Layers,
  Settings,
  Info,
  Share2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Repeat,
  PhoneCall,
  SlidersHorizontal,
  ChevronDown,
  Edit3,
  Compass,
  ArrowUp,
  Maximize2,
  Link as LinkIcon,
  Globe,
  MoreVertical,
  Gamepad2,
  Presentation,
  Award
} from 'lucide-react';

const SAMPLE_DOCS = [
  {
    id: 'sample-1',
    title: 'Dual Nature of Radiation and Matter',
    subtitle: 'Photoelectric effect, de Broglie wavelength & wave-particle duality',
    date: 'Today',
    pdfUrl: '/samples/natural-disaster.pdf',
    text: `The dual nature of radiation and matter demonstrates that light and microscopic matter possess both particle-like and wave-like properties. High-energy electromagnetic waves exhibit corpuscular phenomena such as the photoelectric effect and Compton scattering. Conversely, moving electrons and subatomic particles exhibit wave phenomena including diffraction and interference, as predicted by Louis de Broglie's relation λ = h/p.`
  },
  {
    id: 'sample-2',
    title: 'Artificial Intelligence & Neural Nets',
    subtitle: 'Machine learning, neural networks, LLMs, and ethical alignment',
    date: 'Today',
    pdfUrl: '/samples/artificial-intelligence.pdf',
    text: `Artificial intelligence (AI) is the capability of computational systems to perform tasks typically associated with human intelligence, such as learning, reasoning, problem-solving, perception, and decision-making. Core disciplines include machine learning, deep learning with multi-layer neural architectures, and generative transformers.`
  },
  {
    id: 'sample-3',
    title: 'Ghost Town & Depopulation',
    subtitle: 'Economic boomtowns, resource depletion, and depopulation causes',
    date: 'Yesterday',
    pdfUrl: '/samples/ghost-town.pdf',
    text: `A ghost town or abandoned settlement usually contains visible remaining buildings and infrastructure. A town often becomes a ghost town because the economic activity that supported it has exhausted a local resource or due to natural or human-caused disasters.`
  }
];

// Formats and renders chat text with bold, bullets, code blocks, and headers without showing raw ** or markdown syntax
function FormattedMessageText({ text }) {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
      {parts.map((part, partIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const language = /^[a-zA-Z0-9_-]+$/.test(firstLine) ? firstLine : '';
          const codeContent = language ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div key={partIdx} className="my-2 rounded-xl overflow-hidden border border-[#DDD8CB] bg-[#1C1A17] text-gray-100 font-mono text-xs">
              {language && (
                <div className="px-3 py-1 bg-black/40 text-[10px] text-gray-400 border-b border-white/10 uppercase tracking-wider font-sans font-semibold">
                  {language}
                </div>
              )}
              <pre className="p-3 overflow-x-auto whitespace-pre">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        // Render normal text with headers, bullets, bolding, inline code
        const lines = part.split('\n');
        return (
          <div key={partIdx} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lineIdx} className="h-1" />;
              }

              // Heading: ### or ## or #
              const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
              if (headingMatch) {
                return (
                  <h4 key={lineIdx} className="font-bold text-[#1C1A17] text-sm pt-1 pb-0.5">
                    {renderInlineFormatted(headingMatch[2])}
                  </h4>
                );
              }

              // Bullet item: - or *
              const bulletMatch = line.match(/^[-*]\s+(.*)$/);
              if (bulletMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-[#0D9488] font-bold mt-1 text-[8px] leading-none select-none">●</span>
                    <span className="flex-1 text-[#1C1A17]">{renderInlineFormatted(bulletMatch[1])}</span>
                  </div>
                );
              }

              // Numbered list item: 1. or 2.
              const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-[#0D9488] font-bold text-xs select-none min-w-[14px]">{numMatch[1]}.</span>
                    <span className="flex-1 text-[#1C1A17]">{renderInlineFormatted(numMatch[2])}</span>
                  </div>
                );
              }

              return (
                <p key={lineIdx} className="text-[#1C1A17]">
                  {renderInlineFormatted(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Parses inline bold (**text**), code (`code`), and plain text
function renderInlineFormatted(str) {
  if (!str) return '';
  // Match `code` or **bold**
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const tokens = str.split(regex);

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldContent = token.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-[#1C1A17]">
          {boldContent}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      const codeContent = token.slice(1, -1);
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded-md bg-[#EAE5DA] text-[#1C1A17] font-mono text-[11px] border border-[#DDD8CB]">
          {codeContent}
        </code>
      );
    }
    return token;
  });
}

export function CreateSession() {
  const navigate = useNavigate();

  // Document states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeSample, setActiveSample] = useState(SAMPLE_DOCS[0]);
  const [previewType, setPreviewType] = useState('pdf'); // 'pdf' | 'image' | 'link'
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('/samples/natural-disaster.pdf');
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [extractedText, setExtractedText] = useState(SAMPLE_DOCS[0].text);
  const [documentTitle, setDocumentTitle] = useState(SAMPLE_DOCS[0].title);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [uploadWarning, setUploadWarning] = useState('');
  const [isFullPreviewMode, setIsFullPreviewMode] = useState(false); // Toggle to show full PDF/image in left panel
  const [activeLeftTab, setActiveLeftTab] = useState('doc'); // 'doc' | 'notes' - toggles between original document preview and generated notes
  const [structuredNotesDocument, setStructuredNotesDocument] = useState(null); // Structured JSON document
  const [notesProgressStage, setNotesProgressStage] = useState(null);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  // QuizFetch Interactive In-Place State
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIndex]: optionId }
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Practice Test Config & Execution State
  const [activePracticeMode, setActivePracticeMode] = useState('quiz'); // 'quiz' | 'practice_test'
  const [showPracticeConfig, setShowPracticeConfig] = useState(false);
  const [showNotesConfig, setShowNotesConfig] = useState(false);
  const [selectedNoteDetail, setSelectedNoteDetail] = useState(DETAIL_LEVELS.DETAILED);
  const [selectedPracticeTypes, setSelectedPracticeTypes] = useState([
    'multiple_choice',
    'true_false',
    'short_answers'
  ]);
  const [practiceQuestionCount, setPracticeQuestionCount] = useState(15);
  const [testTimeRemaining, setTestTimeRemaining] = useState(1800); // 30 minutes in seconds (1800s)
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [testScoreData, setTestScoreData] = useState(null);

  // Available question types for Practice Test selection
  const PRACTICE_QUESTION_TYPES = [
    { id: 'case_study', label: 'Case study', desc: 'Real-world scenarios & decision making' },
    { id: 'coding', label: 'Coding questions', desc: 'Code analysis, syntax & problem solving' },
    { id: 'passage_based', label: 'Passage-based questions', desc: 'Reading excerpt comprehension' },
    { id: 'multiple_choice', label: 'Multiple choice', desc: 'Single-correct conceptual multiple choice' },
    { id: 'fill_in_the_blanks', label: 'Fill in the blanks', desc: 'Key terms and formula blanks' },
    { id: 'true_false', label: 'True / False', desc: 'Quick concept verification propositions' },
    { id: 'short_answers', label: 'Short answers', desc: '1-2 sentence concise explanations' },
    { id: 'long_answers', label: 'Long answers', desc: 'In-depth conceptual explanations' },
    { id: 'numerical_problem', label: 'Numerical problem', desc: 'Formulas, quantitative calculations & units' }
  ];

  // Chat Resources Dropdown open state & ref for click outside
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const resourcesDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(event.target)) {
        setIsResourcesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculated duration: scales smoothly from 30 minutes (for 15 questions) up to 90 minutes / 1.5 hours (for 45 questions)
  const calculateTestDurationMinutes = (count) => {
    if (count <= 15) return 30; // 30 minutes
    if (count <= 25) return 45; // 45 minutes
    if (count <= 35) return 60; // 1 hour
    return 90; // 1.5 hours for 45 questions
  };

  const formatTestDurationDisplay = (mins) => {
    if (mins >= 60) {
      const hours = mins / 60;
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }
    return `${mins} mins`;
  };

  // Fallback to ensure preview is always restored if activeSample is selected
  useEffect(() => {
    if (activeSample && !pdfPreviewUrl && !imagePreviewUrl && !linkUrl) {
      setPreviewType('pdf');
      setPdfPreviewUrl(activeSample.pdfUrl);
      setDocumentTitle(activeSample.title);
      setExtractedText(activeSample.text);
    }
  }, [activeSample, pdfPreviewUrl, imagePreviewUrl, linkUrl]);

  // Attached files for the current chat message
  const [chatAttachments, setChatAttachments] = useState([]);
  const [isChatDragOver, setIsChatDragOver] = useState(false);
  const [isSidebarDragOver, setIsSidebarDragOver] = useState(false);

  // Drag-to-resize sidebar / AI area state
  const [sidebarWidth, setSidebarWidth] = useState(560); // in pixels
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // Search in study sets / documents
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Study plan active tab
  const [activeTab, setActiveTab] = useState('All topics');

  // Chat conversation state - Matching exact initial screen
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: "What would you like me to guide you through?",
      timestamp: 'Just now'
    }
  ]);
  const [showQuickOptions, setShowQuickOptions] = useState(true);
  const [inputValue, setInputValue] = useState('');

  // Full Reset for New Chat: Restores pristine initial state identical to page refresh
  const handleResetNewChat = () => {
    if (isListening) stopListening();
    setIsGenerating(false);
    setInputValue('');
    setChatAttachments([]);
    setShowQuickOptions(true);
    setShowPracticeConfig(false);
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        text: "What would you like me to guide you through?",
        timestamp: 'Just now'
      }
    ]);
  };
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatAttachmentInputRef = useRef(null);

  // Web Speech Integration
  const {
    isListening,
    isTranscribing,
    transcript: speechTranscript,
    setTranscript: setSpeechTranscript,
    startListening,
    stopListening,
    speak,
    isSupported: isSpeechSupported
  } = useWebSpeech();

  // Sync speech transcript into input field
  useEffect(() => {
    if (isListening && speechTranscript) {
      setInputValue(speechTranscript);
    }
  }, [speechTranscript, isListening]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Handle panel drag-to-resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      const minW = 320;
      const maxW = Math.max(minW, containerRect.width - 360);

      if (newWidth >= minW && newWidth <= maxW) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Handle multiple PDF, Image, or Study Documents upload
  const handleFileUpload = async (filesOrFile) => {
    if (!filesOrFile) return;
    const fileList = Array.isArray(filesOrFile)
      ? filesOrFile
      : (filesOrFile instanceof FileList ? Array.from(filesOrFile) : [filesOrFile]);

    if (fileList.length === 0) return;

    setIsReadingPdf(true);
    const newUploaded = [];
    let combinedNewText = extractedText || '';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type === 'application/pdf') {
        const preview = URL.createObjectURL(file);
        const title = file.name.replace(/\.pdf$/i, '');

        let pdfText = '';
        try {
          const textResult = await extractTextFromPDF(file);
          pdfText = Array.isArray(textResult) ? textResult.join('\n\n') : (textResult || '');
        } catch (err) {
          console.error("PDF read error:", err);
          pdfText = `Document: ${file.name}`;
        }

        const fileObj = {
          id: Date.now().toString() + '-' + i,
          name: file.name,
          title: title,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          type: 'pdf',
          previewUrl: preview,
          text: pdfText,
          file
        };

        newUploaded.push(fileObj);
        combinedNewText += (combinedNewText ? '\n\n' : '') + `--- Document: ${file.name} ---\n${pdfText}`;
      } else if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        const title = file.name.replace(/\.[^/.]+$/, "");
        const imageContext = `Study Material (Image Note): ${file.name}\nVisual notes and diagram uploaded by user for study session.`;

        const imgObj = {
          id: Date.now().toString() + '-' + i,
          name: file.name,
          title: title,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: 'image',
          previewUrl: preview,
          text: imageContext,
          file
        };

        newUploaded.push(imgObj);
        combinedNewText += (combinedNewText ? '\n\n' : '') + imageContext;
      } else {
        // Text / Markdown / Doc fallback
        const title = file.name.replace(/\.[^/.]+$/, "");
        let textContent = '';
        try {
          textContent = await file.text();
        } catch {
          textContent = `Document content: ${file.name}`;
        }

        const docObj = {
          id: Date.now().toString() + '-' + i,
          name: file.name,
          title: title,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: 'doc',
          previewUrl: null,
          text: textContent,
          file
        };

        newUploaded.push(docObj);
        combinedNewText += (combinedNewText ? '\n\n' : '') + textContent;
      }
    }

    if (newUploaded.length > 0) {
      // Accumulate all uploaded files (without replacing previously uploaded ones)
      setUploadedFiles(prev => {
        const combined = [...prev, ...newUploaded];
        // Combine extracted text across all active uploaded files
        const fullKnowledge = combined.map(f => `=== Document: ${f.name} ===\n${f.text}`).join('\n\n');
        setExtractedText(fullKnowledge);
        return combined;
      });

      setActiveSample(null);

      // Set the newly uploaded file as the active preview
      const latest = newUploaded[0];
      setDocumentTitle(latest.title);
      if (latest.type === 'pdf') {
        setPreviewType('pdf');
        setPdfPreviewUrl(latest.previewUrl);
        setImagePreviewUrl(null);
        setLinkUrl('');
      } else if (latest.type === 'image') {
        setPreviewType('image');
        setImagePreviewUrl(latest.previewUrl);
        setPdfPreviewUrl(null);
        setLinkUrl('');
      }
    }

    setIsReadingPdf(false);
  };

  // Handle adding an external study URL / Link (e.g. Wikipedia, Notion, Article, YouTube)
  const handleAddLink = async (urlToUse = null) => {
    const rawUrl = (urlToUse || inputUrl).trim();
    if (!rawUrl) return;

    let formattedUrl = rawUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      const parsed = new URL(formattedUrl);
      const title = parsed.hostname.replace('www.', '') + (parsed.pathname !== '/' ? parsed.pathname.slice(0, 20) : '');

      if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }

      setPreviewType('link');
      setLinkUrl(formattedUrl);
      setPdfPreviewUrl(null);
      setImagePreviewUrl(null);
      setActiveSample(null);
      setDocumentTitle(`Article: ${title}`);
      setIsAddingLink(false);
      setInputUrl('');

      // Fetch live content from webpage or YouTube video
      try {
        const fetched = await fetchWebUrlContent(formattedUrl);
        setDocumentTitle(fetched.title || `Article: ${title}`);
        setExtractedText(fetched.text);
      } catch (e) {
        console.warn('Failed to fetch full web content, using basic context:', e);
        const linkContext = `Study Material (Web Article / Resource):\nURL: ${formattedUrl}\nDomain: ${parsed.hostname}\nNotes from web material for interactive tutoring and quizzing.`;
        setExtractedText(linkContext);
      }
    } catch {
      alert("Please enter a valid URL (e.g. wikipedia.org or article link)");
    }
  };

  // Helper to open preview for a specific file or sample
  const handleOpenPreviewForFile = (fileItem) => {
    if (!fileItem) return;
    setDocumentTitle(fileItem.title || fileItem.name);
    if (fileItem.type === 'image') {
      setPreviewType('image');
      setImagePreviewUrl(fileItem.previewUrl);
      setPdfPreviewUrl(null);
      setLinkUrl('');
    } else if (fileItem.type === 'link') {
      setPreviewType('link');
      setLinkUrl(fileItem.previewUrl || fileItem.url);
      setPdfPreviewUrl(null);
      setImagePreviewUrl(null);
    } else {
      setPreviewType('pdf');
      setPdfPreviewUrl(fileItem.previewUrl || fileItem.pdfUrl);
      setImagePreviewUrl(null);
      setLinkUrl('');
    }
    setIsQuizMode(false);
    setIsFullPreviewMode(true);
  };

  // Remove a specific uploaded file
  const handleRemoveUploadedFile = (fileId, e) => {
    if (e) e.stopPropagation();
    setUploadedFiles(prev => {
      const target = prev.find(f => f.id === fileId);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const remaining = prev.filter(f => f.id !== fileId);

      // Update knowledge base
      if (remaining.length > 0) {
        const fullKnowledge = remaining.map(f => `=== Document: ${f.name} ===\n${f.text}`).join('\n\n');
        setExtractedText(fullKnowledge);
        // If the removed file was currently active in preview, switch to next available
        if (target && (documentTitle === target.title || documentTitle === target.name)) {
          const next = remaining[0];
          setDocumentTitle(next.title || next.name);
          if (next.type === 'pdf') {
            setPreviewType('pdf');
            setPdfPreviewUrl(next.previewUrl);
            setImagePreviewUrl(null);
          } else if (next.type === 'image') {
            setPreviewType('image');
            setImagePreviewUrl(next.previewUrl);
            setPdfPreviewUrl(null);
          }
        }
      } else {
        // No remaining files: fall back to default sample or empty
        setExtractedText('');
        setPdfPreviewUrl(null);
        setImagePreviewUrl(null);
        setLinkUrl('');
        setDocumentTitle('');
      }

      return remaining;
    });
  };

  const handleSelectSample = (sample) => {
    if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setActiveSample(sample);
    setPreviewType('pdf');
    setPdfPreviewUrl(sample.pdfUrl);
    setImagePreviewUrl(null);
    setLinkUrl('');
    setDocumentTitle(sample.title);
    setExtractedText(sample.text);
  };

  // Launch interactive QuizFetch mode replacing left panel
  const handleStartQuizFetch = async () => {
    setShowQuickOptions(false);
    let contextText = '';
    if (uploadedFiles.length > 0) {
      contextText = uploadedFiles.map(f => `=== [Document: ${f.name}] ===\n${f.text || ''}`).join('\n\n');
    } else {
      contextText = extractedText || (activeSample ? activeSample.text : '');
    }

    if (!contextText.trim()) {
      setUploadWarning("Please upload study notes or select a sample first!");
      setTimeout(() => setUploadWarning(''), 5000);
      return;
    }

    setIsQuizMode(true);
    setIsGeneratingQuiz(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});

    try {
      const questions = await generateQuizFetchQuestions(contextText, 10);
      if (Array.isArray(questions) && questions.length > 0) {
        setQuizQuestions(questions);
      } else {
        throw new Error("No questions returned");
      }
    } catch (err) {
      console.error("QuizFetch generation error:", err);
      // Fallback questions
      setQuizQuestions([
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
        }
      ]);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Countdown timer for Practice Test
  useEffect(() => {
    let interval = null;
    if (isQuizMode && activePracticeMode === 'practice_test' && isTimerRunning && !isTestSubmitted) {
      interval = setInterval(() => {
        setTestTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isQuizMode, activePracticeMode, isTimerRunning, isTestSubmitted]);

  // Format seconds into MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Launch Interactive Practice Test with customization
  const handleOpenPracticeTestConfig = () => {
    setShowQuickOptions(false);
    setShowPracticeConfig(true);
  };

  const handleStartCustomPracticeTest = async () => {
    setShowPracticeConfig(false);
    setActivePracticeMode('practice_test');
    setIsQuizMode(true);
    setIsGeneratingQuiz(true);
    setIsTestSubmitted(false);
    setTestScoreData(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});

    // Calculate time duration
    const durationMins = calculateTestDurationMinutes(practiceQuestionCount, selectedPracticeTypes);
    const totalSecs = durationMins * 60;
    setTestTimeRemaining(totalSecs);

    let contextText = '';
    if (uploadedFiles.length > 0) {
      contextText = uploadedFiles.map(f => `=== [Document: ${f.name}] ===\n${f.text || ''}`).join('\n\n');
    } else {
      contextText = extractedText || (activeSample ? activeSample.text : '');
    }

    try {
      const generated = await generateCustomPracticeTest(contextText, selectedPracticeTypes, practiceQuestionCount);
      if (Array.isArray(generated) && generated.length > 0) {
        setQuizQuestions(generated);
      } else {
        throw new Error("Empty practice questions");
      }
    } catch (err) {
      console.error("Error generating custom practice test:", err);
    } finally {
      setIsGeneratingQuiz(false);
      setIsTimerRunning(true);
    }
  };

  // Evaluate test and compute score
  const handleAutoSubmitTest = () => {
    handleSubmitTest();
  };

  const handleSubmitTest = () => {
    setIsTimerRunning(false);
    setIsTestSubmitted(true);

    let earnedPoints = 0;
    let totalPoints = 0;
    let correctCount = 0;

    const breakdown = quizQuestions.map((q, idx) => {
      const userAns = selectedAnswers[idx] || '';
      const qPoints = q.points || 1;
      totalPoints += qPoints;

      let isCorrect = false;
      if (q.options && q.options.length > 0 && q.correctId) {
        isCorrect = userAns.toUpperCase() === q.correctId.toUpperCase();
      } else if (q.answerKey) {
        // Simple string matching for fill in blank or short answer
        isCorrect = userAns.trim().length > 0 &&
          q.answerKey.toLowerCase().includes(userAns.trim().toLowerCase());
      }

      if (isCorrect) {
        earnedPoints += qPoints;
        correctCount += 1;
      }

      return {
        questionId: q.id,
        question: q.question,
        userAnswer: userAns || 'No answer submitted',
        correctAnswer: q.options?.find(o => o.id === q.correctId)?.text || q.correctId || q.answerKey,
        isCorrect,
        explanation: q.explanation,
        pointsAwarded: isCorrect ? qPoints : 0,
        maxPoints: qPoints
      };
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    const scoreResult = {
      earnedPoints,
      totalPoints,
      correctCount,
      totalQuestions: quizQuestions.length,
      percentage,
      breakdown
    };

    setTestScoreData(scoreResult);

    // Also inform the AI Tutor chat
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'ai',
        text: `🎓 **Practice Test Complete!**\n\nYour score: **${scoreResult.earnedPoints} / ${scoreResult.totalPoints}** points (${scoreResult.percentage}%).\n\nYou answered ${scoreResult.correctCount} out of ${scoreResult.totalQuestions} questions correctly. You can review every question's complete answer key and detailed explanations on the left!`,
        timestamp: 'Just now'
      }
    ]);
  };

  // Handler to generate complete handwritten-style study notes using the Master Prompt & Structured Engine
  const handleGenerateHandwrittenNotes = async (chosenDetail = DETAIL_LEVELS.DETAILED) => {
    setShowQuickOptions(false);
    setIsGeneratingNotes(true);
    setIsFullPreviewMode(true);
    setActiveLeftTab('notes');
    setIsQuizMode(false);
    setNotesProgressStage({ stage: 'analyzing', message: 'Analyzing chapter structure & topic coverage checklist...' });

    let contextText = '';
    if (uploadedFiles.length > 0) {
      contextText = uploadedFiles
        .map(f => `=== [Document: ${f.name}] ===\n${f.text || ''}`)
        .join('\n\n');
    } else {
      contextText = extractedText || (activeSample ? activeSample.text : '');
    }

    const title = uploadedFiles.length > 1
      ? `${uploadedFiles.length} Documents (${uploadedFiles.map(f => f.name).join(', ')})`
      : (documentTitle || (activeSample ? activeSample.title : 'Study Chapter'));

    // Inform user in chat
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: `Please generate comprehensive, exam-oriented study notes for "${title}" (${chosenDetail} level).`,
      timestamp: 'Just now'
    };
    const generatingNotice = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: `✍️ **Generating Structured Study Notes for "${title}"**\n\nI am analyzing the document and generating typed structured content: definitions, KaTeX formulas, step-by-step derivations, comparison tables, and exam questions. You can follow and view them directly in the **Notes Studio** on the left!`,
      timestamp: 'Just now'
    };
    setMessages(prev => [...prev, userMsg, generatingNotice]);

    try {
      // Execute the structured notes engine
      const doc = await generateStructuredNotes({
        documentText: contextText,
        documentTitle: title,
        detailLevel: chosenDetail,
        onProgress: (stage) => setNotesProgressStage(stage)
      });

      setStructuredNotesDocument(doc);

      const completionMsg = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        text: `✨ **Complete Structured Notes are Ready!**\n\nYour comprehensive study notes for **${title}** have been generated with ${doc.sections?.length || 0} main sections, formula sheet, and exam checklist. You can switch between **Handwritten**, **Academic**, and **Exam** themes, or download as PDF on the left anytime!`,
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, completionMsg]);
    } catch (err) {
      console.error('Error generating structured notes:', err);
      const errMsg = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        text: "I encountered an issue generating the full notes. Please verify your connection or try again.",
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsGeneratingNotes(false);
      setNotesProgressStage(null);
    }
  };

  // Launch Quiz or Study Practice (in-chat / AI Tutor)
  const handleStartQuiz = () => {
    setActivePracticeMode('quiz');
    handleStartQuizFetch();
  };

  const handleSendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const query = (textOverride || inputValue).trim();
    if (!query && chatAttachments.length === 0) return;

    setShowQuickOptions(false);

    if (isListening) stopListening();

    const currentAttachments = [...chatAttachments];
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      attachments: currentAttachments,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setChatAttachments([]);
    setIsGenerating(true);

    try {
      // Check if user's message contains web links (e.g. https://... or http://...)
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const matchedUrls = query.match(urlRegex);
      let fetchedUrlContent = '';

      if (matchedUrls && matchedUrls.length > 0) {
        for (const detectedUrl of matchedUrls.slice(0, 2)) {
          try {
            const fetched = await fetchWebUrlContent(detectedUrl);
            fetchedUrlContent += `\n\n=== [Content from Link: ${fetched.title || detectedUrl}] ===\nURL: ${detectedUrl}\n${fetched.text}\n`;

            // Also update preview pane if currently on sample or blank
            if (!uploadedFiles.length && (!linkUrl || linkUrl === '')) {
              setPreviewType('link');
              setLinkUrl(detectedUrl);
              setDocumentTitle(fetched.title || `Article from ${detectedUrl}`);
            }
          } catch (fetchErr) {
            console.warn(`Could not fetch content for ${detectedUrl}:`, fetchErr);
          }
        }
      }

      // Build comprehensive study context across all uploaded documents, active sample, or detected links
      let contextText = '';
      if (uploadedFiles.length > 0) {
        contextText = uploadedFiles
          .map(f => `=== [Document: ${f.name}] ===\n${f.text || ''}`)
          .join('\n\n');
      } else {
        contextText = extractedText || (activeSample ? activeSample.text : '');
      }

      if (fetchedUrlContent) {
        contextText = (contextText ? contextText + '\n\n' : '') + fetchedUrlContent;
      }

      let title = uploadedFiles.length > 1
        ? `${uploadedFiles.length} Documents (${uploadedFiles.map(f => f.name).join(', ')})`
        : (documentTitle || (activeSample ? activeSample.title : 'Study Notes'));

      let fullPrompt = query;
      if (currentAttachments.length > 0) {
        const attachmentNames = currentAttachments.map(a => a.name).join(', ');
        fullPrompt += `\n[User attached file(s): ${attachmentNames}]`;
      }

      const response = await answerQuickQuestion(fullPrompt, contextText, title);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.answer || "I've reviewed your request and document notes.",
        timestamp: 'Just now'
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: "I encountered an issue generating a response. Please try again.",
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Drag and drop handlers for chat
  const handleChatDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatDragOver(true);
  };

  const handleChatDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatDragOver(false);
  };

  const handleChatDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach(file => {
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      setChatAttachments(prev => [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type.startsWith('image/') ? 'image' : 'file',
          previewUrl,
          file
        }
      ]);
      if (file.type === 'application/pdf') {
        handleFileUpload(file);
      }
    });
  };

  return (
    <div className="h-screen w-screen flex bg-[#F7F7EF] text-[#1E1D19] overflow-hidden font-sans">

      {/* ========================================================= */}
      {/* 1. LEFT NARROW ICON SIDEBAR */}
      {/* ========================================================= */}
      <aside className="w-14 bg-[#1C1B17] border-r border-[#2C2A24] flex flex-col items-center justify-between py-3.5 flex-shrink-0 z-30 select-none shadow-sm">

        {/* Top icons */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Logo / App Avatar */}
          <div
            onClick={() => navigate('/dashboard')}
            className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40 shadow-xs cursor-pointer hover:scale-105 transition flex items-center justify-center bg-[#1E3922]"
            title="OMINI-Study Dashboard"
          >
            <img src="/logo.png" alt="OMINI Logo" className="w-full h-full object-cover" />
          </div>

          <div className="w-7 h-px bg-[#2F2D26]" />

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl transition cursor-pointer ${isSearchOpen ? 'bg-[#2F2D26] text-white' : 'text-[#8E8B82] hover:text-white hover:bg-[#2F2D26]'
              }`}
            title="Search Study Sets"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Folders / Sets */}
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl text-[#8E8B82] hover:text-white hover:bg-[#2F2D26] transition cursor-pointer"
            title="Study Materials & Sets"
          >
            <Folder className="w-4 h-4" />
          </button>

          {/* Calendar / Study Plan */}
          <button
            className="p-2 rounded-xl text-[#8E8B82] hover:text-white hover:bg-[#2F2D26] transition cursor-pointer"
            title="Study Calendar"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Flashcard Decks / Layers */}
          <button
            onClick={handleStartQuiz}
            className="p-2 rounded-xl text-[#8E8B82] hover:text-white hover:bg-[#2F2D26] transition cursor-pointer"
            title="Quizzes & Flashcards"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom icons / User Profile */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            className="p-2 rounded-xl text-[#8E8B82] hover:text-white hover:bg-[#2F2D26] transition"
            title="Study Notes Reader"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            className="p-2 rounded-xl text-[#8E8B82] hover:text-white hover:bg-[#2F2D26] transition"
            title="Information"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* User Account Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-[#E5DFCE] border border-[#D1CAAF] text-[#3D3A2C] flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-sky-400/30 transition shadow-xs"
            title="User Account (GS)"
          >
            GS
          </div>
        </div>
      </aside>

      {/* Search Modal Dropdown (if search clicked) */}
      {isSearchOpen && (
        <div className="absolute left-16 top-12 w-80 bg-white border border-[#E5E1D5] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F7F7EF] rounded-xl border border-[#E5E1D5]">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, topics, questions..."
              className="w-full bg-transparent text-xs text-[#1E1D19] outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="mt-2 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Sample Sets</span>
            {SAMPLE_DOCS.map(s => (
              <div
                key={s.id}
                onClick={() => { handleSelectSample(s); setIsSearchOpen(false); }}
                className="px-2 py-1.5 rounded-lg text-xs hover:bg-[#F7F7EF] cursor-pointer flex items-center justify-between"
              >
                <span className="truncate">{s.title}</span>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE AREA: STUDY PLAN + AI TUTOR */}
      {/* ========================================================= */}
      <div ref={containerRef} className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* --------------------------------------------------------- */}
        {/* LEFT COLUMN: 1 Add a file + Sample notes (Exact Image 1)  */}
        {/* --------------------------------------------------------- */}
        <section
          style={{ width: `${sidebarWidth}px` }}
          className={`w-full md:w-auto bg-[#F7F7EF] flex flex-col flex-shrink-0 border-r border-[#DDD8CB] ${isFullPreviewMode ? 'p-3 sm:p-5 overflow-hidden' : 'p-6 sm:p-8 space-y-6 overflow-y-auto'
            }`}
        >
          {isQuizMode ? (
            /* ========================================================= */
            /* QUIZFETCH & PRACTICE TEST VIEW (REPLACES LEFT COLUMN)    */
            /* ========================================================= */
            <div className="flex flex-col h-full space-y-5">
              {/* TOP HEADER BAR */}
              <div className="flex items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3.5">
                {/* Brand Badge */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#DDD8CB] shadow-2xs">
                  {activePracticeMode === 'practice_test' ? (
                    <>
                      <BookOpen className="w-4 h-4 text-[#0D9488]" />
                      <span className="text-xs font-bold text-[#1C1A17] font-sans">Practice Test</span>
                    </>
                  ) : (
                    <>
                      <SlidersHorizontal className="w-4 h-4 text-[#0D9488]" />
                      <span className="text-xs font-bold text-[#1C1A17] font-sans">QuizFetch</span>
                    </>
                  )}
                </div>

                {/* Practice Test Countdown Timer */}
                {activePracticeMode === 'practice_test' && (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono text-xs font-bold transition-colors ${testTimeRemaining < 120
                    ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                    : 'bg-white border-[#DDD8CB] text-[#1C1A17]'
                    }`}>
                    <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>{formatTimer(testTimeRemaining)}</span>
                  </div>
                )}

                {/* Simple Question Number Indicator */}
                <div className="flex items-center justify-center flex-1 py-1">
                  <span className="text-sm font-bold text-[#1C1A17] font-sans">
                    Question {currentQuestionIndex + 1}
                  </span>
                </div>

                {/* Right controls: Exit & Counter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#8E8B82]">
                    {quizQuestions.length > 0
                      ? Math.round((Object.keys(selectedAnswers).filter(k => selectedAnswers[k] !== '').length / quizQuestions.length) * 100)
                      : 0}%
                  </span>

                  {/* Exit Quiz / Test button */}
                  <button
                    onClick={() => {
                      if (activePracticeMode === 'practice_test' && !isTestSubmitted) {
                        if (window.confirm("Are you sure you want to exit the Practice Test? Your progress will be ended.")) {
                          setIsQuizMode(false);
                          setIsTimerRunning(false);
                        }
                      } else {
                        setIsQuizMode(false);
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-black/5 transition"
                    title="Exit Practice"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD8CB] text-xs font-bold text-[#1C1A17] shadow-2xs">
                    {currentQuestionIndex + 1} / {quizQuestions.length || 1}
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isGeneratingQuiz ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
                  <div>
                    <h3 className="text-base font-bold text-[#1C1A17]">
                      {activePracticeMode === 'practice_test' ? 'Crafting your personalized Practice Test...' : 'Generating your custom quiz...'}
                    </h3>
                    <p className="text-xs text-[#8E8B82] mt-1">
                      {activePracticeMode === 'practice_test' ? 'Assembling questions across chosen question types' : 'Analyzing concepts from your notes'}
                    </p>
                  </div>
                </div>
              ) : isTestSubmitted && testScoreData ? (
                /* ======================================================= */
                /* SCORE EVALUATION REPORT VIEW                           */
                /* ======================================================= */
                <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-1">
                  {/* Summary Banner */}
                  <div className="bg-white p-6 rounded-2xl border border-[#DDD8CB] text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1C1A17] font-serif">Practice Test Evaluation</h3>
                      <p className="text-xs text-[#8E8B82]">Complete test performance and answer breakdown</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E5E0D5]">
                        <span className="block text-[10px] uppercase font-bold text-[#8E8B82]">Score</span>
                        <span className="text-lg font-extrabold text-[#1C1A17]">
                          {testScoreData.earnedPoints} / {testScoreData.totalPoints}
                        </span>
                      </div>
                      <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E5E0D5]">
                        <span className="block text-[10px] uppercase font-bold text-[#8E8B82]">Accuracy</span>
                        <span className={`text-lg font-extrabold ${testScoreData.percentage >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {testScoreData.percentage}%
                        </span>
                      </div>
                      <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E5E0D5]">
                        <span className="block text-[10px] uppercase font-bold text-[#8E8B82]">Correct</span>
                        <span className="text-lg font-extrabold text-[#1C1A17]">
                          {testScoreData.correctCount} / {testScoreData.totalQuestions}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Question Review */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#8E8B82] uppercase tracking-wider">Question Review & Answer Key</h4>
                    {testScoreData.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border bg-white space-y-2.5 transition shadow-2xs ${item.isCorrect ? 'border-emerald-200' : 'border-red-200'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-[#1C1A17]">
                            Q{idx + 1}. {item.question}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {item.isCorrect ? `+${item.pointsAwarded} pts` : `0 / ${item.maxPoints} pts`}
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#8E8B82]">Your Answer:</span>
                            <span className={`font-semibold ${item.isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                              {item.userAnswer}
                            </span>
                          </div>
                          {!item.isCorrect && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#8E8B82]">Correct Answer:</span>
                              <span className="font-semibold text-emerald-700">
                                {item.correctAnswer}
                              </span>
                            </div>
                          )}
                        </div>

                        {item.explanation && (
                          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#EBE7DD] text-xs text-[#525049] leading-relaxed">
                            <span className="font-bold text-[#1C1A17] block mb-0.5">Explanation:</span>
                            {item.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Retake or Return */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      onClick={handleOpenPracticeTestConfig}
                      className="px-4 py-2 rounded-xl border border-[#DDD8CB] text-xs font-medium text-[#1C1A17] bg-white hover:bg-gray-50 transition"
                    >
                      Configure New Test
                    </button>
                    <button
                      onClick={() => setIsQuizMode(false)}
                      className="px-5 py-2 rounded-xl bg-[#1C1A17] text-white text-xs font-bold hover:bg-black transition shadow-xs"
                    >
                      Back to Notes
                    </button>
                  </div>
                </div>
              ) : quizQuestions.length > 0 ? (
                /* ======================================================= */
                /* ACTIVE TEST / QUIZ QUESTION DISPLAY                     */
                /* ======================================================= */
                <div className="flex-1 flex flex-col justify-between space-y-5">
                  {(() => {
                    const currentQ = quizQuestions[currentQuestionIndex] || quizQuestions[0];
                    const selectedVal = selectedAnswers[currentQuestionIndex] || '';
                    const isPracticeTest = activePracticeMode === 'practice_test';
                    // In practice test mode, NEVER reveal answer during test. Only reveal in quiz mode after selection.
                    const showFeedback = !isPracticeTest && selectedVal !== '';
                    const isCorrect = showFeedback && selectedVal === currentQ.correctId;

                    return (
                      <div className="space-y-4 flex-1">
                        {/* Question Type Badge */}
                        {currentQ.typeLabel && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#DDD8CB] text-[#0D9488]">
                              {currentQ.typeLabel}
                            </span>
                            {currentQ.points && (
                              <span className="text-[10px] text-[#8E8B82] font-semibold">
                                {currentQ.points} {currentQ.points === 1 ? 'pt' : 'pts'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Scenario / Passage if provided (Case Study / Passage based) */}
                        {currentQ.passage && (
                          <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E0D5] text-xs text-[#525049] leading-relaxed italic">
                            <span className="font-bold not-italic block text-[#1C1A17] mb-1">Scenario / Reference:</span>
                            {currentQ.passage}
                          </div>
                        )}

                        {/* Question Stem (Serif typography) */}
                        <div className="bg-white/70 p-5 rounded-2xl border border-[#EBE7DD]">
                          <p className="text-base sm:text-lg text-[#1C1A17] font-serif leading-relaxed">
                            {currentQ.question}
                          </p>
                        </div>

                        {/* Options List (Multiple Choice / True-False / Options) */}
                        {currentQ.options && currentQ.options.length > 0 ? (
                          <div className="space-y-2.5">
                            {currentQ.options.map((option) => {
                              const isSelected = selectedVal === option.id;
                              let cardStyle = "bg-white border-[#DDD8CB] text-[#1C1A17] hover:border-[#0D9488]/60 hover:bg-[#FAF9F5]";
                              let badgeStyle = "bg-[#F0EDE6] text-[#6E6B62] group-hover:bg-[#E2DDD3]";

                              if (showFeedback) {
                                if (option.id === currentQ.correctId) {
                                  cardStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-medium";
                                  badgeStyle = "bg-emerald-600 text-white";
                                } else if (isSelected && !isCorrect) {
                                  cardStyle = "bg-red-50 border-red-400 text-red-950";
                                  badgeStyle = "bg-red-500 text-white";
                                } else {
                                  cardStyle = "bg-white/80 border-[#DDD8CB] text-[#8E8B82] opacity-75";
                                }
                              } else if (isSelected) {
                                cardStyle = "bg-[#E6FAF7] border-[#0D9488] text-[#0D9488] font-medium";
                                badgeStyle = "bg-[#0D9488] text-white";
                              }

                              return (
                                <button
                                  key={option.id}
                                  onClick={() => {
                                    if (isPracticeTest && isTestSubmitted) return;
                                    setSelectedAnswers(prev => ({
                                      ...prev,
                                      [currentQuestionIndex]: option.id
                                    }));
                                  }}
                                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center gap-3.5 group shadow-2xs ${cardStyle}`}
                                >
                                  <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors ${badgeStyle}`}>
                                    {option.id}
                                  </span>
                                  <span className="text-xs sm:text-sm flex-1 leading-snug">
                                    {option.text}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Text Input for Short Answers / Numerical / Fill in the Blanks */
                          <div className="space-y-2 pt-2">
                            <label className="text-xs font-semibold text-[#8E8B82]">Type your answer:</label>
                            <textarea
                              rows={3}
                              value={selectedVal}
                              onChange={(e) => {
                                setSelectedAnswers(prev => ({
                                  ...prev,
                                  [currentQuestionIndex]: e.target.value
                                }));
                              }}
                              placeholder="Write your answer here..."
                              className="w-full p-3.5 rounded-2xl border border-[#DDD8CB] bg-white text-xs sm:text-sm text-[#1C1A17] focus:outline-none focus:border-[#0D9488] shadow-2xs resize-none"
                            />
                          </div>
                        )}

                        {/* Explanation Banner (Only in QuizFetch mode, NOT during active practice test) */}
                        {showFeedback && currentQ.explanation && (
                          <div className={`p-4 rounded-2xl text-xs sm:text-sm border leading-relaxed animate-in fade-in ${isCorrect
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50/90 border-amber-200 text-amber-900'
                            }`}>
                            <div className="font-bold mb-1 flex items-center gap-1.5">
                              {isCorrect ? '✓ Correct Answer' : 'ℹ Explanation'}
                            </div>
                            {currentQ.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* BOTTOM NAVIGATION ACTIONS */}
                  <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between gap-3">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 rounded-xl border border-[#DDD8CB] text-xs font-medium text-[#1C1A17] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (currentQuestionIndex < quizQuestions.length - 1) {
                            setCurrentQuestionIndex(prev => prev + 1);
                          }
                        }}
                        className="px-3 py-2 text-xs font-medium text-[#8E8B82] hover:text-[#1C1A17] transition"
                      >
                        Skip
                      </button>

                      {currentQuestionIndex < quizQuestions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                          className="px-5 py-2 rounded-xl bg-[#1C1A17] text-white text-xs font-bold hover:bg-black transition shadow-xs flex items-center gap-1.5"
                        >
                          Next Question
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : activePracticeMode === 'practice_test' ? (
                        <button
                          onClick={handleSubmitTest}
                          className="px-5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-teal-700 transition shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Submit Test
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsQuizMode(false)}
                          className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
                        >
                          Finish Quiz
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[#8E8B82] text-xs">
                  No questions available. Try reloading notes.
                </div>
              )}
            </div>
          ) : isFullPreviewMode ? (
            /* ========================================================= */
            /* FULL PREVIEW VIEW (RESPONSIVE BOXED WITH SPACE AROUND)    */
            /* ========================================================= */
            <div className="flex flex-col h-full w-full space-y-3 min-w-0">
              {/* Minimalist Top Control Bar with Doc vs Notes switcher */}
              <div className="bg-white border border-[#DDD8CB] rounded-2xl px-4 py-2.5 flex items-center justify-between flex-shrink-0 shadow-2xs gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Switch between original document preview and generated handwritten notes */}
                  <div className="flex items-center bg-[#FAF9F5] border border-[#DDD8CB] rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveLeftTab('doc')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeLeftTab === 'doc'
                        ? 'bg-white text-[#1C1A17] shadow-xs'
                        : 'text-[#8E8B82] hover:text-[#1C1A17]'
                        }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0D9488]" />
                      <span>Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLeftTab('notes')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeLeftTab === 'notes'
                        ? 'bg-amber-100 text-amber-950 shadow-xs'
                        : 'text-[#8E8B82] hover:text-[#1C1A17]'
                        }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Handwritten Notes</span>
                    </button>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[#1C1A17] truncate font-serif hidden sm:inline-block max-w-[180px]">
                    {activeLeftTab === 'notes' ? `Notes: ${documentTitle || 'Study Material'}` : (documentTitle || 'Document Preview')}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Close Preview Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullPreviewMode(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDD8CB] bg-[#F7F7EF] hover:bg-[#EFECE3] text-xs font-bold text-[#1C1A17] transition cursor-pointer shadow-2xs flex-shrink-0"
                    title="Close preview"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Boxed Responsive Preview Body with Breathing Room & Rounded Corners */}
              <div className="flex-1 w-full rounded-2xl overflow-hidden border border-[#DDD8CB] bg-white shadow-xs relative min-w-0 min-h-0">
                {/* Transparent overlay during panel drag to prevent iframe from capturing mouse events */}
                {isResizing && (
                  <div className="absolute inset-0 z-30 bg-transparent cursor-col-resize select-none" />
                )}

                {/* TAB 1: GENERATED HANDWRITTEN NOTES VIEW (POWERED BY REACT NOTES STUDIO) */}
                {activeLeftTab === 'notes' ? (
                  <NotesStudio
                    document={structuredNotesDocument}
                    isGenerating={isGeneratingNotes}
                    progressStage={notesProgressStage}
                    onRegenerate={(detail) => handleGenerateHandwrittenNotes(detail)}
                    onClose={() => setIsFullPreviewMode(false)}
                  />
                ) : (
                  /* TAB 2: ORIGINAL DOCUMENT / PDF / IMAGE / LINK PREVIEW */
                  <>
                    {previewType === 'pdf' && pdfPreviewUrl ? (
                      <iframe
                        src={pdfPreviewUrl}
                        title={documentTitle}
                        className={`w-full h-full border-0 block ${isResizing ? 'pointer-events-none' : ''}`}
                      />
                    ) : previewType === 'image' && imagePreviewUrl ? (
                      <div className={`w-full h-full flex items-center justify-center p-3 bg-[#FAF9F5] overflow-auto ${isResizing ? 'pointer-events-none' : ''}`}>
                        <img
                          src={imagePreviewUrl}
                          alt={documentTitle}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-xs border border-[#DDD8CB]"
                        />
                      </div>
                    ) : previewType === 'link' && linkUrl ? (
                      <iframe
                        src={linkUrl}
                        title={documentTitle}
                        className={`w-full h-full border-0 block ${isResizing ? 'pointer-events-none' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#8E8B82] space-y-2 bg-[#FAF9F5]">
                        <FileText className="w-10 h-10 stroke-1 text-gray-300" />
                        <p className="text-xs">No active preview source available.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Header: 1 Add a file with Preview button right after the title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Green badge displaying exact number of uploaded files / PDFs */}
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center transition-all shadow-xs">
                      {uploadedFiles.length > 0 ? uploadedFiles.length : 1}
                    </span>
                    <h2 className="text-base font-bold text-[#1C1A17] font-serif">Add a file</h2>

                    {/* PREVIEW BUTTON RIGHT AFTER THE NAME */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLeftTab('doc');
                        setIsFullPreviewMode(true);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#DDD8CB] bg-white hover:bg-[#FAF9F5] hover:border-[#0D9488] text-xs font-bold text-[#1C1A17] shadow-2xs transition cursor-pointer group"
                      title="Preview active study document"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0D9488] group-hover:scale-110 transition-transform" />
                      <span>Preview</span>
                    </button>

                    {/* NOTE PREVIEW BUTTON RIGHT AFTER PREVIEW */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLeftTab('notes');
                        setIsFullPreviewMode(true);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#DDD8CB] bg-amber-50 hover:bg-amber-100 hover:border-amber-400 text-xs font-bold text-amber-900 shadow-2xs transition cursor-pointer group"
                      title="Preview complete handwritten-style study notes"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
                      <span>Note Preview</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#8E8B82] pl-7.5">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded (${uploadedFiles.filter(f => f.type === 'pdf').length} PDF${uploadedFiles.filter(f => f.type === 'pdf').length === 1 ? '' : 's'}). Drop in more anytime.`
                    : "Drop in anything you'd like to use."}
                </p>
              </div>

              {/* Reading State */}
              {isReadingPdf && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Processing your study material...</span>
                </div>
              )}

              {/* 1. Drag & Drop Upload Zone (Always accessible) */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsSidebarDragOver(true); }}
                onDragLeave={() => setIsSidebarDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsSidebarDragOver(false);
                  const files = Array.from(e.dataTransfer.files || []);
                  if (files.length > 0) handleFileUpload(files);
                }}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${isSidebarDragOver
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-emerald-200 hover:border-emerald-400 bg-white'
                  }`}
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  {/* 3 Floating Icon Stack (Headphones, Document, Image) */}
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm scale-105 z-10">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#1C1A17] font-serif">
                    Drag your notes here
                  </h3>

                  <p className="text-xs text-[#8E8B82]">
                    PDF, images, text, or web links — any language.
                  </p>

                  {/* File browse and Link actions */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer">
                      <span>Or browse your files (multiple allowed)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,image/*,audio/*,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(Array.from(e.target.files));
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>

                    <span className="text-[#DDD8CB]">•</span>

                    <button
                      type="button"
                      onClick={() => setIsAddingLink(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:text-[#0b7a70] hover:underline cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Paste link</span>
                    </button>
                  </div>

                  {/* Inline Add Link popup/bar */}
                  {isAddingLink && (
                    <div className="w-full mt-3 p-2.5 rounded-xl bg-[#F7F7EF] border border-[#DDD8CB] flex items-center gap-2 animate-fadeIn">
                      <LinkIcon className="w-4 h-4 text-[#8E8B82] flex-shrink-0" />
                      <input
                        type="url"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Paste article, wiki, or doc link..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLink();
                          }
                        }}
                        className="flex-1 bg-transparent text-xs text-[#1C1A17] outline-none placeholder-[#8E8B82]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleAddLink()}
                        className="px-2.5 py-1 bg-[#1C1B17] hover:bg-black text-white text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAddingLink(false); setInputUrl(''); }}
                        className="p-1 text-gray-400 hover:text-black rounded-lg cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Document Preview Section (PDF, Image, or Article) */}
              {(pdfPreviewUrl || imagePreviewUrl || linkUrl) && (
                <div className="rounded-2xl border border-[#DDD8CB] overflow-hidden bg-white shadow-xs">
                  {/* If multiple files are uploaded, display a horizontal tab strip */}
                  {uploadedFiles.length > 1 && (
                    <div className="flex items-center gap-1.5 p-2 bg-[#F7F7EF] border-b border-[#DDD8CB] overflow-x-auto text-xs">
                      <span className="text-[10px] font-bold uppercase text-[#8E8B82] px-1 flex-shrink-0">
                        Files ({uploadedFiles.length}):
                      </span>
                      {uploadedFiles.map((f) => {
                        const isActive = documentTitle === f.title || documentTitle === f.name;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setDocumentTitle(f.title || f.name);
                              if (f.type === 'pdf') {
                                setPreviewType('pdf');
                                setPdfPreviewUrl(f.previewUrl);
                                setImagePreviewUrl(null);
                                setLinkUrl('');
                              } else if (f.type === 'image') {
                                setPreviewType('image');
                                setImagePreviewUrl(f.previewUrl);
                                setPdfPreviewUrl(null);
                                setLinkUrl('');
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${isActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-[#DDD8CB] text-[#1C1A17] hover:bg-[#EFECE3]'
                              }`}
                          >
                            {f.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            <span className="truncate max-w-[120px]">{f.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="p-3 bg-[#EFECE3] border-b border-[#DDD8CB] flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                        {previewType === 'image' ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : previewType === 'link' ? (
                          <LinkIcon className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[#1C1A17] truncate max-w-[240px]">
                        {documentTitle}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(pdfPreviewUrl);
                        if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
                        setPdfPreviewUrl(null);
                        setImagePreviewUrl(null);
                        setLinkUrl('');
                        setExtractedText('');
                        setDocumentTitle('');
                        setActiveSample(null);
                        setUploadedFiles([]);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Remove material"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PDF Preview */}
                  {previewType === 'pdf' && pdfPreviewUrl && (
                    <iframe
                      src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                      className="w-full h-96 border-0 bg-white"
                      title={documentTitle}
                    />
                  )}

                  {/* Image Preview */}
                  {previewType === 'image' && imagePreviewUrl && (
                    <div className="w-full h-96 bg-[#1C1B17]/5 flex items-center justify-center p-4 overflow-hidden">
                      <img
                        src={imagePreviewUrl}
                        alt={documentTitle}
                        className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
                      />
                    </div>
                  )}

                  {/* Web Link / Article Preview */}
                  {previewType === 'link' && linkUrl && (
                    <div className="w-full h-96 bg-white p-6 flex flex-col justify-between items-center text-center">
                      <div className="my-auto space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-[#E6FAF7] border border-[#BFF5F5] text-[#0D9488] flex items-center justify-center mx-auto shadow-xs">
                          <Globe className="w-7 h-7" />
                        </div>
                        <h4 className="font-serif font-bold text-base text-[#1C1A17] max-w-sm">
                          {documentTitle}
                        </h4>
                        <p className="text-xs text-[#8E8B82] max-w-xs break-all">
                          {linkUrl}
                        </p>
                      </div>
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C1B17] hover:bg-black text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <span>Open link in new tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* OR TRY WITH A SAMPLE section (All in Green) */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block text-center">
                  OR TRY WITH A SAMPLE
                </span>

                <div className="space-y-2.5">
                  {SAMPLE_DOCS.map((sample) => {
                    const isSelected = activeSample?.id === sample.id;
                    return (
                      <div
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${isSelected
                          ? 'border-emerald-600 bg-[#EBF7EE] shadow-sm ring-1 ring-emerald-500/20'
                          : 'border-[#DDD8CB]/80 hover:border-emerald-500 bg-white hover:bg-emerald-50/20'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Icon container: Solid green when selected, soft green when unselected */}
                          <div className={`p-2.5 rounded-xl flex-shrink-0 transition-colors ${isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-100 text-emerald-700'
                            }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate transition-colors ${isSelected ? 'text-emerald-950' : 'text-[#1C1A17]'
                              }`}>
                              {sample.title}
                            </p>
                            <p className="text-[11px] text-[#8E8B82] truncate">{sample.subtitle}</p>
                          </div>
                        </div>

                        {/* Status badge / Checkmark: Green */}
                        {isSelected ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-600 opacity-0 hover:opacity-100 transition-opacity">
                            Select
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* STUDY TOOLS / PRACTICE CARDS (Interactive & Scrollable)  */}
              {/* --------------------------------------------------------- */}
              <div className="space-y-3 pt-3 border-t border-[#DDD8CB]/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8B82]">
                    Study Tools & Practice
                  </span>
                  <span className="text-[10px] font-semibold text-[#0D9488] bg-[#E6FAF7] px-2 py-0.5 rounded-md">
                    6 Modes
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-4">

                  {/* Card 1: Note Generation (Light Green) */}
                  <div
                    onClick={() => {
                      setShowNotesConfig(true);
                      setShowPracticeConfig(false);
                      setShowQuickOptions(false);
                    }}
                    className="bg-white border border-[#DDD8CB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="bg-[#B9F588] h-28 sm:h-32 flex items-center justify-center p-3 transition-transform group-hover:scale-[1.02]">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Shadow underneath */}
                        <path d="M22 46H48L44 42H22V46Z" fill="#1C1B17" />
                        {/* Back card */}
                        <rect x="22" y="16" width="28" height="26" rx="2" fill="white" stroke="#1C1B17" strokeWidth="2.4" />
                        {/* Front card */}
                        <rect x="14" y="14" width="28" height="26" rx="2" fill="white" stroke="#1C1B17" strokeWidth="2.4" />
                        {/* Lines on front card */}
                        <line x1="20" y1="26" x2="36" y2="26" stroke="#1C1B17" strokeWidth="2.2" strokeLinecap="round" />
                        <line x1="20" y1="32" x2="30" y2="32" stroke="#1C1B17" strokeWidth="2.2" strokeLinecap="round" />
                        {/* Paperclip */}
                        <path d="M20 18V10C20 8.343 21.343 7 23 7C24.657 7 26 8.343 26 10V22" stroke="#1C1B17" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="p-3 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#5BB318]" />
                        <span className="text-xs font-bold text-[#1C1A17]">Note generation</span>
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-[#8E8B82] group-hover:text-black" />
                    </div>
                  </div>

                  {/* Card 2: QuizFetch (Light Blue) */}
                  <div
                    onClick={handleStartQuiz}
                    className="bg-white border border-[#DDD8CB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="bg-[#BAF3F5] h-28 sm:h-32 flex items-center justify-center p-3 transition-transform group-hover:scale-[1.02]">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Bottom shadow ellipse */}
                        <ellipse cx="32" cy="46" rx="16" ry="3.5" fill="#1C1B17" />
                        {/* 3 stacked speech bubble cards with questions */}
                        <rect x="16" y="24" width="22" height="14" rx="2" fill="white" stroke="#1C1B17" strokeWidth="2" />
                        <text x="21" y="32" fill="#1C1B17" fontSize="7" fontWeight="bold">?</text>
                        <line x1="25" y1="31" x2="33" y2="31" stroke="#1C1B17" strokeWidth="1.6" strokeLinecap="round" />

                        <rect x="28" y="16" width="22" height="14" rx="2" fill="white" stroke="#1C1B17" strokeWidth="2" />
                        <text x="33" y="24" fill="#1C1B17" fontSize="7" fontWeight="bold">?</text>
                        <line x1="37" y1="23" x2="45" y2="23" stroke="#1C1B17" strokeWidth="1.6" strokeLinecap="round" />

                        <rect x="22" y="30" width="22" height="14" rx="2" fill="white" stroke="#1C1B17" strokeWidth="2" />
                        <text x="27" y="38" fill="#1C1B17" fontSize="7" fontWeight="bold">?</text>
                        <line x1="31" y1="37" x2="39" y2="37" stroke="#1C1B17" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="p-3 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#0D9488]" />
                        <span className="text-xs font-bold text-[#1C1A17]">QuizFetch</span>
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-[#8E8B82] group-hover:text-black" />
                    </div>
                  </div>

                  {/* Card 3: Tutor (Soft Lilac/Purple) */}
                  <div
                    onClick={() => {
                      setShowQuickOptions(false);
                      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      const inputEl = document.querySelector('input[placeholder*="Ask your AI tutor"]');
                      if (inputEl) inputEl.focus();
                    }}
                    className="bg-white border border-[#DDD8CB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="bg-[#F2DBFD] h-28 sm:h-32 flex items-center justify-center p-3 transition-transform group-hover:scale-[1.02]">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Projector / Screen presentation whiteboard */}
                        <ellipse cx="32" cy="48" rx="14" ry="3" fill="#1C1B17" />
                        {/* Tripod legs */}
                        <line x1="32" y1="40" x2="24" y2="48" stroke="#1C1B17" strokeWidth="2.4" strokeLinecap="round" />
                        <line x1="32" y1="40" x2="40" y2="48" stroke="#1C1B17" strokeWidth="2.4" strokeLinecap="round" />
                        <line x1="32" y1="36" x2="32" y2="48" stroke="#1C1B17" strokeWidth="2.4" strokeLinecap="round" />
                        {/* Board */}
                        <rect x="18" y="14" width="28" height="20" rx="3" fill="white" stroke="#1C1B17" strokeWidth="2.4" />
                        {/* Inner screen */}
                        <rect x="22" y="18" width="10" height="12" rx="1" fill="#F2DBFD" stroke="#1C1B17" strokeWidth="1.6" />
                        <line x1="35" y1="20" x2="42" y2="20" stroke="#1C1B17" strokeWidth="1.8" strokeLinecap="round" />
                        <line x1="35" y1="24" x2="42" y2="24" stroke="#1C1B17" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="p-3 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-[#1C1A17]">Tutor</span>
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-[#8E8B82] group-hover:text-black" />
                    </div>
                  </div>

                  {/* Card 4: Audio Recap (Soft Lilac/Pink) */}
                  <div
                    onClick={() => {
                      setShowQuickOptions(false);
                      const txt = extractedText || "Here is your audio recap.";
                      speak(txt.slice(0, 300));
                    }}
                    className="bg-white border border-[#DDD8CB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="bg-[#F2DBFD] h-28 sm:h-32 flex items-center justify-center p-3 transition-transform group-hover:scale-[1.02]">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Bottom shadow */}
                        <ellipse cx="32" cy="49" rx="15" ry="3.2" fill="#1C1B17" />
                        {/* In-ear Headphones */}
                        <path d="M26 15C26 13.343 27.343 12 29 12H30C31.105 12 32 12.895 32 14V28C32 29.105 31.105 30 30 30H28C26.895 30 26 29.105 26 28V15Z" fill="white" stroke="#1C1B17" strokeWidth="2.2" />
                        <path d="M38 15C38 13.343 36.657 12 35 12H34C32.895 12 32 12.895 32 14V28C32 29.105 32.895 30 34 30H36C37.105 30 38 29.105 38 28V15Z" fill="white" stroke="#1C1B17" strokeWidth="2.2" />
                        {/* Wires coiled */}
                        <path d="M29 30V36C29 38 31 40 33 40H39C41 40 43 42 43 44C43 46 41 48 39 48H25" stroke="#1C1B17" strokeWidth="2.4" strokeLinecap="round" />
                        {/* Jack */}
                        <rect x="42" y="46" width="7" height="4" rx="1" fill="#1C1B17" />
                      </svg>
                    </div>
                    <div className="p-3 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-[#1C1A17]">Audio Recap</span>
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-[#8E8B82] group-hover:text-black" />
                    </div>
                  </div>

                  {/* Card 5: Arcade (Light Green) */}
                  <div
                    onClick={handleStartQuiz}
                    className="bg-white border border-[#DDD8CB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="bg-[#B9F588] h-28 sm:h-32 flex items-center justify-center p-3 transition-transform group-hover:scale-[1.02]">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Bottom shadow */}
                        <ellipse cx="32" cy="46" rx="14" ry="3" fill="#1C1B17" />
                        {/* Gamepad controller */}
                        <path d="M22 23C20 23 16 26 15 32C14 38 18 43 22 41L26 39H38L42 41C46 43 50 38 49 32C48 26 44 23 42 23H22Z" fill="white" stroke="#1C1B17" strokeWidth="2.4" strokeLinejoin="round" />
                        {/* D-Pad */}
                        <path d="M22 28V34M19 31H25" stroke="#1C1B17" strokeWidth="2.2" strokeLinecap="round" />
                        {/* Buttons */}
                        <circle cx="41" cy="29" r="1.5" fill="#1C1B17" />
                        <circle cx="44" cy="32" r="1.5" fill="#1C1B17" />
                        {/* Cord */}
                        <path d="M32 23V16C32 14 35 13 36 15C37 17 40 18 41 16" stroke="#1C1B17" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="p-3 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-[#5BB318]" />
                        <span className="text-xs font-bold text-[#1C1A17]">Arcade</span>
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-[#8E8B82] group-hover:text-black" />
                    </div>
                  </div>

                  {/* Card 6: Practice Test (Light Cyan) */}
                  <div
                    onClick={handleOpenPracticeTestConfig}
                    className="bg-white border border-[#DDD8CB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="bg-[#BAF3F5] h-28 sm:h-32 flex items-center justify-center p-3 transition-transform group-hover:scale-[1.02]">
                      <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Shadow */}
                        <path d="M38 48H47L43 44H38V48Z" fill="#1C1B17" />
                        {/* Test paper sheet */}
                        <rect x="20" y="14" width="24" height="32" rx="3" fill="white" stroke="#1C1B17" strokeWidth="2.4" />
                        {/* ABCD options */}
                        <text x="24" y="22" fill="#1C1B17" fontSize="5.5" fontWeight="bold">A</text>
                        <line x1="28" y1="21" x2="38" y2="21" stroke="#1C1B17" strokeWidth="1.6" strokeLinecap="round" />
                        <text x="24" y="27" fill="#1C1B17" fontSize="5.5" fontWeight="bold">B</text>
                        <line x1="28" y1="26" x2="38" y2="26" stroke="#1C1B17" strokeWidth="1.6" strokeLinecap="round" />
                        <text x="24" y="32" fill="#1C1B17" fontSize="5.5" fontWeight="bold">C</text>
                        <line x1="28" y1="31" x2="38" y2="31" stroke="#1C1B17" strokeWidth="1.6" strokeLinecap="round" />
                        <text x="24" y="37" fill="#1C1B17" fontSize="5.5" fontWeight="bold">D</text>
                        <line x1="28" y1="36" x2="38" y2="36" stroke="#1C1B17" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="p-3 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#0D9488]" />
                        <span className="text-xs font-bold text-[#1C1A17]">Practice Test</span>
                      </div>
                      <MoreVertical className="w-3.5 h-3.5 text-[#8E8B82] group-hover:text-black" />
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </section>

        {/* --------------------------------------------------------- */}
        {/* DRAGGABLE RESIZER HANDLE */}
        {/* --------------------------------------------------------- */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className={`hidden md:flex w-2.5 hover:w-2.5 items-center justify-center cursor-col-resize z-20 group relative select-none transition-all ${isResizing ? 'bg-[#0D9488]' : 'bg-transparent hover:bg-black/5'
            }`}
          title="Drag to resize panels"
        >
          <div className={`w-[1px] h-full transition-colors ${isResizing ? 'bg-[#0D9488]' : 'bg-[#DDD8CB] group-hover:bg-[#0D9488]'}`} />
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-8 rounded-full bg-white border border-[#DDD8CB] shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <GripVertical className="w-2.5 h-2.5 text-gray-400 group-hover:text-[#0D9488]" />
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* RIGHT COLUMN: GUIDED AI STUDY ASSISTANT */}
        {/* --------------------------------------------------------- */}
        <section
          onDragOver={handleChatDragOver}
          onDragLeave={handleChatDragLeave}
          onDrop={handleChatDrop}
          className="flex-1 flex flex-col bg-[#F7F7EF] overflow-hidden relative"
        >
          {/* Header of AI area */}
          <div className="h-12 border-b border-[#DDD8CB] px-6 flex items-center justify-between bg-[#F7F7EF] flex-shrink-0">
            {/* Title with dropdown showing document/PDF title */}
            <div
              ref={resourcesDropdownRef}
              className="relative"
              onMouseEnter={() => setIsResourcesOpen(true)}
              onMouseLeave={() => setIsResourcesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsResourcesOpen(prev => !prev)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg transition cursor-pointer select-none ${isResourcesOpen
                  ? 'text-[#0D9488] bg-black/5'
                  : 'text-[#1C1A17] hover:text-[#0D9488] hover:bg-black/5'
                  }`}
              >
                <span>Chat</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isResourcesOpen ? 'rotate-180 text-[#0D9488]' : ''}`} />
              </button>

              {/* Click / Hover Persistent Dropdown with 0 gap and seamless mouse hover bridge */}
              {isResourcesOpen && (
                <div
                  className="absolute left-0 top-full pt-1 w-80 z-40 animate-in fade-in zoom-in-95 duration-100"
                  onMouseEnter={() => setIsResourcesOpen(true)}
                >
                  <div className="bg-white border border-[#DDD8CB] rounded-2xl shadow-xl p-3 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8B82] block">
                        Active Study Resources ({uploadedFiles.length > 0 ? uploadedFiles.length : 1})
                      </span>
                      <span className="text-[10px] text-[#0D9488] font-medium">
                        Click to preview
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                      {/* When custom files are uploaded, list each one in a neat boxed element */}
                      {uploadedFiles.length > 0 ? (
                        uploadedFiles.map((f) => {
                          const isActive = documentTitle === f.title || documentTitle === f.name;
                          return (
                            <div
                              key={f.id}
                              onClick={() => {
                                handleOpenPreviewForFile(f);
                                setIsResourcesOpen(false);
                              }}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group/card ${isActive
                                ? 'bg-[#EBF7EE] border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                                : 'bg-[#F7F7EF] border-[#DDD8CB] hover:bg-white hover:border-emerald-400'
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg flex-shrink-0 ${f.type === 'image'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                  {f.type === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#1C1A17] truncate">
                                    {f.name}
                                  </p>
                                  <p className="text-[10px] text-[#8E8B82] truncate">
                                    {f.type === 'image' ? 'Image Note' : 'PDF Document'} • {f.size}
                                  </p>
                                </div>
                              </div>

                              {/* Cross button to remove this specific file */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveUploadedFile(f.id, e);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer flex-shrink-0"
                                title="Remove file"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        /* Default active sample when no files uploaded yet */
                        <div
                          onClick={() => {
                            if (activeSample) handleOpenPreviewForFile(activeSample);
                            setIsResourcesOpen(false);
                          }}
                          className="p-2.5 rounded-xl border border-emerald-500 bg-[#EBF7EE] shadow-xs flex items-center justify-between gap-2 cursor-pointer hover:bg-emerald-50 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#1C1A17] truncate">
                                {documentTitle || 'Dual Nature of Radiation and Matter'}
                              </p>
                              <p className="text-[10px] text-emerald-700 truncate">
                                Active sample material for AI tutor
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Plus button with 'New chat' tooltip and reset handler */}
              <button
                type="button"
                onClick={handleResetNewChat}
                className="text-gray-500 hover:text-black p-1.5 rounded-lg hover:bg-[#EFECE3] transition cursor-pointer"
                title="New chat"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={handleStartQuiz}
                className="text-gray-500 hover:text-black p-1.5 rounded-lg hover:bg-[#EFECE3] transition cursor-pointer"
                title="Fullscreen Quiz / Scorecard"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Full Drag Over Overlay */}
          {isChatDragOver && (
            <div className="absolute inset-0 bg-[#F7F7EF]/90 z-20 flex flex-col items-center justify-center pointer-events-none border-2 border-dashed border-[#0D9488]">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-[#0D9488] flex items-center justify-center animate-bounce mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#1C1A17]">Drop files or images here</p>
              <p className="text-xs text-gray-500">Minnie will attach them to your chat message</p>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

            {/* Chat Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${isUser ? 'ml-auto' : 'mr-auto'
                    }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        🐶
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${isUser
                          ? 'bg-[#EAE5DA] text-[#1C1A17] font-medium rounded-br-xs'
                          : 'bg-transparent text-[#1C1A17]'
                          }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        ) : (
                          <FormattedMessageText text={msg.text} />
                        )}

                        {/* Interactive File Pills in Message (Click to preview on left side) */}
                        {msg.files && msg.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2.5 mt-2 border-t border-[#DDD8CB]/50">
                            {msg.files.map((f, i) => (
                              <button
                                key={f.id || i}
                                type="button"
                                onClick={() => handleOpenPreviewForFile(f)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#DDD8CB] bg-white hover:bg-[#FAF9F5] hover:border-[#0D9488] shadow-2xs transition text-left cursor-pointer group/filepill"
                                title="Click to view full preview on left side"
                              >
                                <div className={`p-1 rounded-md ${f.type === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                  {f.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-[#1C1A17] block truncate max-w-[150px]">
                                    {f.name}
                                  </span>
                                  <span className="text-[10px] text-[#0D9488] font-semibold group-hover/filepill:underline flex items-center gap-0.5">
                                    Click to preview on left →
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI Reaction Icons */}
                      {!isUser && (
                        <div className="flex items-center gap-2 text-[#8E8B82] text-xs pl-1">
                          <button className="hover:text-black"><Copy className="w-3 h-3" /></button>
                          <button className="hover:text-black"><ThumbsUp className="w-3 h-3" /></button>
                          <button className="hover:text-black"><ThumbsDown className="w-3 h-3" /></button>
                          <button className="hover:text-black"><Repeat className="w-3 h-3" /></button>
                          <button onClick={() => speak(msg.text)} className="hover:text-black"><Volume2 className="w-3 h-3" /></button>
                          <button className="hover:text-black"><Info className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Note Generation Configuration Card (Triggered from right options or study tools) */}
            {showNotesConfig && (
              <div className="p-5 rounded-2xl bg-white border border-[#DDD8CB] shadow-md space-y-4 animate-in fade-in max-w-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1A17] font-serif">Configure Notes Generation</h4>
                      <p className="text-xs text-[#8E8B82]">Select your preferred depth of coverage and explanation:</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotesConfig(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-black transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 4 Detail Levels: Quick notes, Standard notes, Detailed notes, Complete chapter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { id: DETAIL_LEVELS.QUICK, title: 'Quick notes', desc: 'Concise high-yield summary, formulas & core definitions', icon: '⚡' },
                    { id: DETAIL_LEVELS.STANDARD, title: 'Standard notes', desc: 'Balanced explanations with solved examples and concepts', icon: '📖' },
                    { id: DETAIL_LEVELS.DETAILED, title: 'Detailed notes', desc: 'Deep university explanations, formulas, derivations & questions', icon: '✍️' },
                    { id: DETAIL_LEVELS.EXHAUSTIVE, title: 'Complete chapter', desc: 'Exhaustive syllabus coverage of every theorem, table & model answer', icon: '📚' }
                  ].map((level) => {
                    const isSelected = selectedNoteDetail === level.id;
                    return (
                      <div
                        key={level.id}
                        onClick={() => setSelectedNoteDetail(level.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition select-none flex items-start gap-3 ${isSelected
                          ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400 shadow-2xs'
                          : 'bg-[#FAF9F5] border-[#E5E0D5] hover:bg-white'
                          }`}
                      >
                        <span className="text-xl mt-0.5">{level.icon}</span>
                        <div className="space-y-0.5 flex-1">
                          <span className="font-bold block text-[#1C1A17]">{level.title}</span>
                          <span className="text-[11px] text-[#8E8B82] leading-tight block">{level.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-[#8E8B82] italic">
                  ℹ Notes will be generated by the AI Engine and presented on the left side with KaTeX math, tables, and handwritten notebook styling.
                </div>

                {/* Action buttons */}
                <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E0D5]">
                  <button
                    type="button"
                    onClick={() => setShowNotesConfig(false)}
                    className="px-4 py-2 rounded-xl border border-[#DDD8CB] text-xs font-medium text-[#1C1A17] bg-white hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotesConfig(false);
                      handleGenerateHandwrittenNotes(selectedNoteDetail);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-teal-700 transition shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Notes on Left</span>
                  </button>
                </div>
              </div>
            )}

            {/* Practice Test Configuration Card (Renders BELOW the greeting message) */}
            {showPracticeConfig && (
              <div className="p-5 rounded-2xl bg-white border border-[#DDD8CB] shadow-md space-y-4 animate-in fade-in max-w-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1A17] font-serif">Configure Your Practice Test</h4>
                      <p className="text-xs text-[#8E8B82]">Select the question types you want to be tested on:</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPracticeConfig(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-black transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Type Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {PRACTICE_QUESTION_TYPES.map((typeItem) => {
                    const isChecked = selectedPracticeTypes.includes(typeItem.id);
                    return (
                      <label
                        key={typeItem.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${isChecked
                          ? 'bg-[#E6FAF7] border-[#0D9488] text-[#1C1A17]'
                          : 'bg-[#FAF9F5] border-[#E5E0D5] text-[#525049] hover:bg-white'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPracticeTypes(prev => [...prev, typeItem.id]);
                            } else {
                              if (selectedPracticeTypes.length > 1) {
                                setSelectedPracticeTypes(prev => prev.filter(t => t !== typeItem.id));
                              }
                            }
                          }}
                          className="mt-0.5 rounded text-[#0D9488] focus:ring-[#0D9488] border-gray-300 w-3.5 h-3.5"
                        />
                        <div className="space-y-0.5 flex-1">
                          <span className="font-bold block text-[#1C1A17]">{typeItem.label}</span>
                          <span className="text-[10px] text-[#8E8B82] leading-tight block">{typeItem.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Number of Questions (15 to 45) & Estimated Time Duration (30 mins to 1.5 hours) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E0D5]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#8E8B82]">Questions:</span>
                    {[15, 25, 35, 45].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPracticeQuestionCount(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${practiceQuestionCount === num
                          ? 'bg-[#1C1A17] text-white shadow-2xs'
                          : 'bg-gray-100 text-[#525049] hover:bg-gray-200'
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Calculated Test Duration Badge (30 minutes to 1.5 hours) */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Duration: {formatTestDurationDisplay(calculateTestDurationMinutes(practiceQuestionCount))}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#8E8B82] italic">
                  ℹ In Practice Test mode, correct answers will remain hidden until you submit your test or the timer runs out.
                </div>

                {/* Generate Button: 'Generate Practice Test' */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPracticeConfig(false)}
                    className="px-4 py-2 rounded-xl border border-[#DDD8CB] text-xs font-medium text-[#1C1A17] bg-white hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartCustomPracticeTest}
                    className="px-5 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-teal-700 transition shadow-xs flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Practice Test</span>
                  </button>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-[#8E8B82] pl-8">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D9488]" />
                <span>AI Tutor is formulating your response...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* 'I want to...' Options Card (Matching Exact Screenshot - Removed Once Any Option Clicked) */}
          {showQuickOptions && (
            <div className="px-4 sm:px-6 py-3 animate-in fade-in">
              <div className="bg-[#EFECE3] border border-[#DDD8CB] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
                <h4 className="text-base font-bold text-[#1C1A17] font-serif">I want to...</h4>
                <div className="space-y-2.5">
                  {/* 1. Note generation */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickOptions(false);
                      setShowNotesConfig(true);
                      setShowPracticeConfig(false);
                    }}
                    className="w-full bg-white hover:bg-[#FAF9F5] border border-[#DDD8CB] hover:border-[#0D9488] rounded-2xl px-5 py-3 text-sm font-bold text-[#1C1A17] flex items-center gap-3.5 transition shadow-2xs group text-left cursor-pointer"
                  >
                    <FileText className="w-5 h-5 text-[#0D9488] group-hover:scale-105 transition-transform flex-shrink-0" />
                    <span>Note generation</span>
                  </button>

                  {/* 2. Practice Test */}
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenPracticeTestConfig();
                    }}
                    className="w-full bg-white hover:bg-[#FAF9F5] border border-[#DDD8CB] hover:border-[#0D9488] rounded-2xl px-5 py-3 text-sm font-bold text-[#1C1A17] flex items-center gap-3.5 transition shadow-2xs group text-left cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5 text-[#0D9488] group-hover:scale-105 transition-transform flex-shrink-0" />
                    <span className="text-sm font-bold text-[#1C1A17]">Practice Test</span>
                  </button>

                  {/* 3. QuizFetch */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickOptions(false);
                      handleStartQuiz();
                    }}
                    className="w-full bg-white hover:bg-[#FAF9F5] border border-[#DDD8CB] hover:border-[#0D9488] rounded-2xl px-5 py-3 text-sm font-bold text-[#1C1A17] flex items-center gap-3.5 transition shadow-2xs group text-left cursor-pointer"
                  >
                    <SlidersHorizontal className="w-5 h-5 text-[#0D9488] group-hover:scale-105 transition-transform flex-shrink-0" />
                    <span>QuizFetch</span>
                  </button>

                  {/* Something else input trigger */}
                  <div
                    onClick={() => {
                      setShowQuickOptions(false);
                      const inputEl = document.querySelector('input[placeholder*="Ask your AI tutor"]');
                      if (inputEl) inputEl.focus();
                    }}
                    className="w-full bg-white border border-[#DDD8CB] rounded-2xl px-5 py-3 text-sm text-[#8E8B82] cursor-text hover:border-gray-400 transition shadow-2xs"
                  >
                    Something else...
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fixed Bottom Input Area */}
          <div className="p-4 sm:p-5 bg-[#F7F7EF] flex-shrink-0">
            {/* Attachment preview */}
            {chatAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {chatAttachments.map((att) => (
                  <div key={att.id} className="relative rounded-xl border border-[#DDD8CB] bg-white p-1.5 pr-6 flex items-center gap-2 text-xs">
                    <Paperclip className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span className="truncate max-w-[140px] text-xs font-medium text-[#1C1A17]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setChatAttachments(prev => prev.filter(a => a.id !== att.id))}
                      className="absolute right-1.5 top-1.5 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="bg-white border border-[#DDD8CB] rounded-2xl p-2.5 shadow-sm space-y-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setShowQuickOptions(false);
                  }
                }}
                onFocus={() => {
                  if (inputValue.trim().length > 0) {
                    setShowQuickOptions(false);
                  }
                }}
                placeholder="Ask your AI tutor anything..."
                className="w-full px-2 text-xs sm:text-sm text-[#1C1A17] placeholder-[#8E8B82] outline-none bg-transparent"
              />

              <div className="flex items-center justify-between pt-1">
                {/* Left tools inside input */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => chatAttachmentInputRef.current?.click()}
                    className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-[#EFECE3] transition"
                    title="Attach file"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <input
                    ref={chatAttachmentInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      Array.from(e.target.files || []).forEach(file => {
                        setChatAttachments(prev => [
                          ...prev,
                          {
                            id: Date.now().toString() + Math.random(),
                            name: file.name,
                            size: (file.size / 1024).toFixed(1) + ' KB',
                            type: 'file',
                            file
                          }
                        ]);
                        if (file.type === 'application/pdf') handleFileUpload(file);
                      });
                      e.target.value = '';
                    }}
                  />

                  <div className="flex items-center gap-1 text-xs text-[#0D9488] font-semibold bg-[#E6FAF7] border border-[#BFF5F5] px-2 py-0.5 rounded-lg">
                    <Compass className="w-3 h-3" />
                    <span>Guided</span>
                  </div>
                </div>

                {/* Right tools: Glowing Microphone button + Send arrow */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        startListening((t) => setInputValue(t));
                      }
                    }}
                    className={`relative p-2 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center ${isListening
                      ? 'bg-gradient-to-tr from-sky-400 via-indigo-500 to-violet-500 text-white shadow-lg shadow-sky-400/50 ring-4 ring-violet-400/40 animate-pulse'
                      : isTranscribing
                        ? 'bg-gradient-to-tr from-sky-300 to-violet-400 text-white animate-spin'
                        : 'bg-[#F7F7EF] hover:bg-[#EFECE3] text-[#1C1A17] hover:text-[#0D9488] border border-[#DDD8CB]'
                      }`}
                    title={isListening ? "Listening... Click to stop" : "Speak to AI Tutor"}
                  >
                    {isListening && (
                      <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-sky-400 to-violet-500 opacity-75 blur-sm animate-pulse -z-10" />
                    )}

                    {isTranscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isListening ? (
                      <Mic className="w-4 h-4 text-white" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={isGenerating || (!inputValue.trim() && chatAttachments.length === 0)}
                    className="w-8 h-8 rounded-xl bg-[#1C1A17] hover:bg-black text-white flex items-center justify-center disabled:opacity-40 shadow-xs cursor-pointer transition-colors"
                    title="Send"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

      </div>
    </div>
  );
}
