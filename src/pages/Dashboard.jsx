import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowRight, 
  Play, 
  Sparkles, 
  ChevronDown, 
  LogOut, 
  Volume2, 
  Share2, 
  Edit2, 
  Plus, 
  Send, 
  ChevronLeft, 
  ChevronRight,
  Brain,
  Headphones,
  Folder,
  RotateCw,
  MessageSquare
} from 'lucide-react';
import { MindgraspLogo } from '../components/MindgraspLogo';

export function Dashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [previewTab, setPreviewTab] = useState('quizzes');
  const [previewAnswer, setPreviewAnswer] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || '');
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleStartFreeSession = () => {
    navigate('/create');
  };

  return (
    <div className="min-h-screen bg-[#F7F7EF] font-sans text-[#1C1A17] flex flex-col justify-between">
      
      {/* ======================================================== */}
      {/* Top Navbar matching StudyFetch warm linen look */}
      {/* ======================================================== */}
      <header className="bg-[#F7F7EF]/90 backdrop-blur-md border-b border-[#DDD8CB] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-10">
            <button onClick={() => navigate('/dashboard')} className="cursor-pointer">
              <MindgraspLogo className="h-10" />
            </button>

            {/* Nav links matching clean aesthetic */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#1C1A17]">
              <button 
                type="button"
                className="flex items-center gap-1.5 hover:text-[#0D9488] transition-colors cursor-pointer"
              >
                <span>Features</span>
                <ChevronDown className="w-4 h-4 text-[#8E8B82]" />
              </button>
              <button 
                type="button"
                className="flex items-center gap-1.5 hover:text-[#0D9488] transition-colors cursor-pointer"
              >
                <span>Solutions</span>
                <ChevronDown className="w-4 h-4 text-[#8E8B82]" />
              </button>
              <button 
                type="button"
                className="flex items-center gap-1.5 hover:text-[#0D9488] transition-colors cursor-pointer"
              >
                <span>Resources</span>
                <ChevronDown className="w-4 h-4 text-[#8E8B82]" />
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            {userEmail ? (
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-[#8E8B82] hidden md:inline-block">
                  {userEmail}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="text-xs font-semibold text-[#8E8B82] hover:text-red-600 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-semibold text-[#1C1A17] hover:text-[#0D9488] cursor-pointer"
              >
                Sign in
              </button>
            )}

            {/* Try for Free CTA */}
            <button
              onClick={handleStartFreeSession}
              className="bg-[#1C1B17] hover:bg-black active:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Try for Free
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* Hero Section matching StudyFetch editorial look */}
      {/* ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 w-full space-y-10">
        
        {/* Hero Title & Badges */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          
          {/* #1 AI Study Tool pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6FAF7] border border-[#BFF5F5] text-[#0D9488] text-xs font-bold tracking-tight">
            <span>#1 AI Study Tool</span>
          </div>

          {/* Social Proof Avatars */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-[#F7F7EF] bg-teal-100 text-[10px] font-bold flex items-center justify-center">🎓</span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-[#F7F7EF] bg-amber-100 text-[10px] font-bold flex items-center justify-center">📚</span>
              <span className="inline-block h-6 w-6 rounded-full ring-2 ring-[#F7F7EF] bg-emerald-100 text-[10px] font-bold flex items-center justify-center">💡</span>
            </div>
            <span className="text-xs text-[#8E8B82] font-medium">
              Used by 5m+ students to study smarter, not longer.
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-[#1C1A17] tracking-tight leading-[1.12]">
            Study Smarter with AI.{' '}
            <br className="hidden sm:inline" />
            Remember More.{' '}
            <span className="text-[#0D9488] italic">Stress Less</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#8E8B82] max-w-2xl mx-auto leading-relaxed">
            Turn lectures and any material into a complete, science-backed AI study system—so you understand more, remember longer, and stress less.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            
            {/* Primary Button: Start My Free Study Session -> */}
            <button
              onClick={handleStartFreeSession}
              className="bg-[#1C1B17] hover:bg-black active:bg-gray-800 text-white px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-md transition-all flex items-center gap-2.5 cursor-pointer group"
            >
              <span>Start My Free Study Session</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Watch How It Works Button */}
            <button
              type="button"
              onClick={() => alert("Watch our 1-minute demo to see how OMINI-Study creates instant active recall sessions.")}
              className="bg-white hover:bg-[#EFECE3] border border-[#DDD8CB] text-[#1C1A17] px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-[#8E8B82] fill-[#8E8B82]" />
              <span>Watch How It Works</span>
            </button>

          </div>
        </div>

        {/* ======================================================== */}
        {/* Embedded Interactive OMINI-Study Session Window */}
        {/* ======================================================== */}
        <div className="pt-4">
          <div className="bg-[#EFECE3] border border-[#DDD8CB] rounded-3xl p-3 sm:p-5 shadow-xl shadow-stone-900/5">
            
            {/* Window Chrome Header */}
            <div className="bg-white rounded-2xl border border-[#DDD8CB] shadow-xs overflow-hidden">
              
              {/* Session Top Bar */}
              <div className="px-4 sm:px-6 h-14 flex items-center justify-between border-b border-[#DDD8CB]">
                <div className="flex items-center gap-3">
                  <MindgraspLogo className="h-6" />
                  <span className="text-[#DDD8CB]">|</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8E8B82]">
                    <span className="text-[#0D9488]">Home</span>
                    <span>›</span>
                    <span className="border-b border-dashed border-[#DDD8CB] text-[#1C1A17]">Natural disaster</span>
                    <Edit2 className="w-3 h-3 text-[#8E8B82]" />
                  </div>
                </div>

                <button 
                  type="button"
                  className="bg-[#0D9488] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-default"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Session</span>
                </button>
              </div>

              {/* Tabs Bar */}
              <div className="px-4 sm:px-6 py-2.5 bg-[#F7F7EF] border-b border-[#DDD8CB] flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button 
                    onClick={() => setPreviewTab('content')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      previewTab === 'content' ? 'bg-white border border-[#DDD8CB] text-[#1C1A17] font-bold shadow-xs' : 'bg-[#EFECE3] text-[#8E8B82]'
                    }`}
                  >
                    Original Content
                  </button>
                  <button 
                    onClick={() => setPreviewTab('notes')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      previewTab === 'notes' ? 'bg-white border border-[#DDD8CB] text-[#1C1A17] font-bold shadow-xs' : 'bg-[#EFECE3] text-[#8E8B82]'
                    }`}
                  >
                    <span className="text-[#0D9488] font-bold">AI</span> Notes
                  </button>
                  <button 
                    onClick={() => setPreviewTab('summary')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      previewTab === 'summary' ? 'bg-white border border-[#DDD8CB] text-[#1C1A17] font-bold shadow-xs' : 'bg-[#EFECE3] text-[#8E8B82]'
                    }`}
                  >
                    <span className="text-[#0D9488] font-bold">AI</span> Summary
                  </button>
                  <button 
                    onClick={() => setPreviewTab('flashcards')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      previewTab === 'flashcards' ? 'bg-white border border-[#DDD8CB] text-[#1C1A17] font-bold shadow-xs' : 'bg-[#EFECE3] text-[#8E8B82]'
                    }`}
                  >
                    <span className="text-[#0D9488] font-bold">AI</span> Flashcards
                  </button>
                  <button 
                    onClick={() => setPreviewTab('quizzes')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                      previewTab === 'quizzes' ? 'bg-white border border-[#DDD8CB] text-[#1C1A17] font-bold shadow-xs' : 'bg-[#EFECE3] text-[#8E8B82]'
                    }`}
                  >
                    <span className="text-[#0D9488] font-bold">AI</span> Quizzes
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#0D9488]">
                  <Volume2 className="w-4 h-4 cursor-pointer" />
                  <Share2 className="w-4 h-4 cursor-pointer" />
                  <span className="text-[#8E8B82] pl-1 hidden sm:inline">AI Tutor</span>
                </div>
              </div>

              {/* 2-Column Split Preview with increased height & breathing room */}
              <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 bg-white min-h-[500px]">
                
                {/* Left side: Quiz Card */}
                <div className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-[#8E8B82]">
                      <span className="bg-[#1C1B17] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-default">
                        Quit
                      </span>
                      <ChevronLeft className="w-4 h-4 text-[#DDD8CB]" />
                      <span className="w-7 h-7 rounded-full border border-[#0D9488] text-[#0D9488] font-bold flex items-center justify-center bg-[#E6FAF7] text-xs">1</span>
                      <span className="w-7 h-7 rounded-full text-[#8E8B82] flex items-center justify-center text-xs">2</span>
                      <span className="w-7 h-7 rounded-full text-[#8E8B82] flex items-center justify-center text-xs">3</span>
                      <span className="w-7 h-7 rounded-full text-[#8E8B82] flex items-center justify-center text-xs">4</span>
                      <span className="w-7 h-7 rounded-full text-[#8E8B82] flex items-center justify-center text-xs">5</span>
                      <ChevronRight className="w-4 h-4 text-[#8E8B82]" />
                    </div>
                    <p className="text-xs text-[#8E8B82] pl-0.5">Showing 1-7 of 50 questions</p>
                  </div>

                  <div className="bg-[#F7F7EF] border border-[#DDD8CB] rounded-2xl p-8 sm:p-10 text-center flex-1 flex flex-col justify-center items-center space-y-6 shadow-xs my-auto min-h-[300px]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488] bg-[#E6FAF7] border border-[#BFF5F5] px-3 py-1 rounded-full">
                      Active Recall Question
                    </span>

                    <h3 className="font-serif font-bold text-[#1C1A17] text-base sm:text-lg max-w-md leading-relaxed">
                      The Earth's surface is covered by approximately _______% of ocean water.
                    </h3>

                    <input
                      type="text"
                      value={previewAnswer}
                      onChange={(e) => setPreviewAnswer(e.target.value)}
                      placeholder="Enter your answer..."
                      className="w-full max-w-sm mx-auto block px-4 py-3 rounded-xl bg-white border border-[#DDD8CB] text-sm text-center focus:outline-none focus:border-[#0D9488] shadow-xs text-[#1C1A17]"
                    />

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <span className="px-5 py-2 rounded-xl bg-[#DDD8CB] text-[#1C1A17] text-xs font-semibold cursor-default">Previous</span>
                      <span className="px-5 py-2 rounded-xl bg-white border border-[#DDD8CB] text-[#8E8B82] text-xs font-semibold cursor-default">Skip</span>
                      <span className="px-6 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold shadow-xs cursor-default">
                        Next
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: AI Tutor Card */}
                <div className="bg-[#F7F7EF] border border-[#DDD8CB] rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5 min-h-[420px] shadow-xs">
                  <div className="space-y-4 flex-1">
                    <div className="flex justify-end">
                      <span className="bg-[#EAE5DA] text-[#1C1A17] text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-tr-xs font-medium max-w-xs shadow-xs">
                        What is the great oxidation event?
                      </span>
                    </div>

                    <div className="bg-white border border-[#DDD8CB] rounded-2xl p-5 text-xs sm:text-sm text-[#1C1A17] space-y-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        <h4 className="font-serif font-bold text-sm sm:text-base text-[#1C1A17]">The Great Oxidation Event</h4>
                      </div>
                      <p className="leading-relaxed text-[#8E8B82] text-xs sm:text-sm">
                        The <strong className="text-[#1C1A17]">Great Oxidation Event (GOE)</strong>, also known as the Great Oxygenation Event, refers to a significant biological and environmental turning point where Earth's atmospheric oxygen levels rose dramatically approximately <strong className="text-[#1C1A17]">2.4 to 2.3 billion years ago</strong>.
                      </p>
                      <div className="pt-1">
                        <p className="font-bold text-[#1C1A17] text-xs sm:text-sm">Key Features:</p>
                        <ul className="list-disc list-inside space-y-1.5 text-[#8E8B82] text-xs sm:text-sm mt-1 pl-1">
                          <li><strong className="text-[#1C1A17]">Oxygen Production:</strong> Driven primarily by early photosynthetic cyanobacteria.</li>
                          <li><strong className="text-[#1C1A17]">Atmospheric Shift:</strong> Transformed Earth from an anaerobic to an aerobic biosphere.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center bg-white border border-[#DDD8CB] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#8E8B82] justify-between shadow-xs">
                    <span>Ask AI assistant...</span>
                    <span className="bg-[#1C1B17] text-white p-1.5 rounded-lg">
                      <Send className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* "Sound familiar? Studying feels harder than it should" */}
        {/* ======================================================== */}
        <section className="pt-20 pb-12 text-center space-y-12 max-w-7xl mx-auto w-full">
          {/* Eyebrow & Headline */}
          <div className="space-y-3">
            <span className="text-sm sm:text-base font-medium text-[#8E8B82]">
              Sound familiar?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1C1A17] tracking-tight leading-[1.2]">
              Studying feels <span className="text-[#0D9488] italic font-normal">harder</span>
              <br />
              <span className="text-[#0D9488] italic font-normal">than it should</span>
            </h2>
          </div>

          {/* 4 Cards Grid matching image with increased width & comfortable spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-7 text-center">
            
            {/* Card 1: Lost in long lectures */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#DDD8CB] shadow-xs hover:shadow-md transition-shadow flex flex-col items-center justify-start space-y-5 min-h-[310px]">
              <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-20 h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Headphone arc */}
                  <path d="M12 36V28C12 16.954 20.954 8 32 8C43.046 8 52 16.954 52 28V36" stroke="#0D9488" strokeWidth="3.2" strokeLinecap="round" />
                  {/* Left ear cup */}
                  <rect x="8" y="32" width="8" height="18" rx="4" fill="#BFF5F5" stroke="#0D9488" strokeWidth="2.8" />
                  {/* Right ear cup */}
                  <rect x="48" y="32" width="8" height="18" rx="4" fill="#BFF5F5" stroke="#0D9488" strokeWidth="2.8" />
                  {/* Soundwave bars */}
                  <path d="M26 28V34M30 25V37M34 22V40M38 27V35" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
                  {/* Circular Play badge */}
                  <circle cx="32" cy="46" r="8.5" fill="#BFF5F5" stroke="#0D9488" strokeWidth="2.2" />
                  <path d="M30 42L36.5 46L30 50V42Z" fill="#1C1B17" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1C1A17]">
                Lost in long lectures
              </h3>
              <p className="text-sm text-[#8E8B82] leading-relaxed">
                "I zoned out 20 minutes in... now I'm completely lost"
              </p>
            </div>

            {/* Card 2: Scattered notes */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#DDD8CB] shadow-xs hover:shadow-md transition-shadow flex flex-col items-center justify-start space-y-5 min-h-[310px]">
              <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-20 h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Back folder flap */}
                  <path d="M10 20C10 17.79 11.79 16 14 16H24L28 20H50C52.21 20 54 21.79 54 24V44C54 46.21 52.21 48 50 48H14C11.79 48 10 46.21 10 44V20Z" fill="#EFECE3" stroke="#0D9488" strokeWidth="2.5" strokeLinejoin="round" />
                  {/* Front folder angled flap */}
                  <path d="M14 27H53.5L47.5 49H8L14 27Z" fill="#BFF5F5" stroke="#0D9488" strokeWidth="2.8" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1C1A17]">
                Scattered notes
              </h3>
              <p className="text-sm text-[#8E8B82] leading-relaxed">
                "Scattered across Google Docs, Notion, and random papers"
              </p>
            </div>

            {/* Card 3: Read it. Forgot it */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#DDD8CB] shadow-xs hover:shadow-md transition-shadow flex flex-col items-center justify-start space-y-5 min-h-[310px]">
              <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-20 h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* 4 circular arrows forming cycle */}
                  <path d="M26 12C31.5 10 38.5 11 43 14.5L41 18.5L52 17L48.5 6L45 10C39.5 5.5 31.5 4.5 24.5 7L26 12Z" fill="#BFF5F5" stroke="#0D9488" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M52 26C54 31.5 53 38.5 49.5 43L45.5 41L47 52L58 48.5L54 45C58.5 39.5 59.5 31.5 57 24.5L52 26Z" fill="#BFF5F5" stroke="#0D9488" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M38 52C32.5 54 25.5 53 21 49.5L23 45.5L12 47L15.5 58L19 54C24.5 58.5 32.5 59.5 39.5 57L38 52Z" fill="#BFF5F5" stroke="#0D9488" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 38C10 32.5 11 25.5 14.5 21L18.5 23L17 12L6 15.5L10 19C5.5 24.5 4.5 32.5 7 39.5L12 38Z" fill="#BFF5F5" stroke="#0D9488" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1C1A17]">
                Read it. Forgot it
              </h3>
              <p className="text-sm text-[#8E8B82] leading-relaxed">
                "I read this chapter 3 times and still can't remember it"
              </p>
            </div>

            {/* Card 4: Stuck with no help */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#DDD8CB] shadow-xs hover:shadow-md transition-shadow flex flex-col items-center justify-start space-y-5 min-h-[310px]">
              <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-20 h-20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Chat speech bubble */}
                  <path d="M10 20C10 15.58 13.58 12 18 12H44C48.42 12 52 15.58 52 20V36C52 40.42 48.42 44 44 44H20L12 52V44H10C10 44 10 24 10 20Z" fill="#BFF5F5" stroke="#0D9488" strokeWidth="2.8" strokeLinejoin="round" />
                  {/* Text lines inside bubble */}
                  <line x1="18" y1="22" x2="32" y2="22" stroke="#1C1B17" strokeWidth="2.6" strokeLinecap="round" />
                  <line x1="18" y1="28" x2="36" y2="28" stroke="#1C1B17" strokeWidth="2.6" strokeLinecap="round" />
                  <line x1="18" y1="34" x2="30" y2="34" stroke="#1C1B17" strokeWidth="2.6" strokeLinecap="round" />
                  {/* Question mark badge circle */}
                  <circle cx="44" cy="22" r="9.5" fill="#EFECE3" stroke="#0D9488" strokeWidth="2.2" />
                  {/* Question mark text inside badge */}
                  <text x="44" y="27.5" fill="#0D9488" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">?</text>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1C1A17]">
                Stuck with no help
              </h3>
              <p className="text-sm text-[#8E8B82] leading-relaxed">
                "It's midnight, I'm confused, and there's no one to explain this to me"
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-[#EFECE3] border-t border-[#DDD8CB] py-6 text-center text-xs text-[#8E8B82]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <MindgraspLogo className="h-6" />
          <p>© {new Date().getFullYear()} OMINI-Study • The #1 AI Study Tool for Students</p>
        </div>
      </footer>
    </div>
  );
}
