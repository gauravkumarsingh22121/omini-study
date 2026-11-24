import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Home, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  Trophy, 
  FileText, 
  Brain, 
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { MindgraspLogo } from '../components/MindgraspLogo';

export function Scorecard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const locationState = location.state || {};
  const evalResults = locationState.evalResults || [
    { question: "What is active recall?", answer: "Retrieving information from memory.", score: 90, isCorrect: true, feedback: "Excellent! You highlighted memory retrieval accurately." },
    { question: "Why is spaced repetition important?", answer: "It stops you from forgetting.", score: 80, isCorrect: true, feedback: "Good answer! It systematically flattens the forgetting curve." }
  ];
  const documentTitle = locationState.documentTitle || "Sample Study Notes";
  const pdfText = locationState.pdfText || "Sample text context...";

  const totalScore = evalResults.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const averageScore = Math.round(totalScore / Math.max(1, evalResults.length));
  const masteredCount = evalResults.filter(r => r.isCorrect).length;
  const incorrectCount = evalResults.length - masteredCount;
  
  let tier = "Needs Review";
  let tierColor = "text-red-600";
  let tierBg = "bg-red-50";
  let tierBorder = "border-red-200";
  let ringStroke = "#EF4444";

  if (averageScore >= 80) {
    tier = "Mastery Achieved";
    tierColor = "text-[#9718FB]";
    tierBg = "bg-[#FAF5FF]";
    tierBorder = "border-[#F0E5FF]";
    ringStroke = "#9718FB";
  } else if (averageScore >= 50) {
    tier = "Good Progress";
    tierColor = "text-amber-600";
    tierBg = "bg-amber-50";
    tierBorder = "border-amber-200";
    ringStroke = "#F59E0B";
  }

  useEffect(() => {
    if (averageScore >= 70) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#9718FB', '#C084FC', '#38BDF8', '#10B981']
      });
    }
  }, [averageScore]);

  const handleRetry = () => {
    navigate('/create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7FF] via-[#FFFFFF] to-[#F9F8FD] font-sans text-[#333333] flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#F0E5FF] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <MindgraspLogo />
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6A6A7A] hover:text-[#9718FB] bg-white hover:bg-[#FAF5FF] border border-gray-200 hover:border-[#F0E5FF] px-3.5 py-2 rounded-xl transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8 flex-1">
        
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4E6FF] text-[#9718FB] text-xs font-bold tracking-tight">
            <Trophy className="w-3.5 h-3.5" />
            <span>Study Session Complete</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E0532]">
            Your OMINI-Study <span className="text-[#9718FB] italic">Mastery Report</span>
          </h1>

          <p className="text-sm text-[#6A6A7A] flex items-center justify-center gap-1.5">
            <FileText className="w-4 h-4 text-[#9718FB]" />
            <span className="font-semibold text-[#1E0532]">{documentTitle}</span>
          </p>
        </div>

        {/* Hero Scorecard Card */}
        <div className="bg-white border border-[#EFE5FC] rounded-3xl p-8 sm:p-10 shadow-mindgrasp space-y-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-around gap-8 pb-8 border-b border-gray-100">
            {/* Circular Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="#F4E6FF"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke={ringStroke}
                  strokeWidth="8"
                  strokeDasharray={`${(averageScore / 100) * 264} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold font-serif text-[#1E0532]">{averageScore}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#82837C]">Score</span>
              </div>
            </div>

            {/* Score Meta Details */}
            <div className="space-y-3 text-center sm:text-left">
              <div className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${tierBg} ${tierColor} border ${tierBorder}`}>
                {tier}
              </div>

              <h2 className="text-2xl font-serif font-bold text-[#1E0532]">
                {averageScore >= 80 
                  ? "Fantastic recall performance!" 
                  : averageScore >= 50 
                    ? "Solid effort! Revisit key areas." 
                    : "Needs another study pass."}
              </h2>

              <p className="text-sm text-[#6A6A7A] max-w-md">
                You scored <span className="font-bold text-emerald-600">{masteredCount} correct</span> and{' '}
                <span className="font-bold text-red-500">{incorrectCount} incorrect/need review</span> out of{' '}
                <span className="font-bold text-[#1E0532]">{evalResults.length}</span> questions tested from your notes.
              </p>
            </div>
          </div>

          {/* Metrics Trio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[#FAF8FD] border border-[#F0E5FF]">
              <p className="text-[11px] font-bold uppercase text-[#82837C]">Total Questions</p>
              <p className="text-xl font-extrabold text-[#1E0532] mt-1">{evalResults.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <p className="text-[11px] font-bold uppercase text-emerald-700">Correct</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">{masteredCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
              <p className="text-[11px] font-bold uppercase text-red-700">Incorrect</p>
              <p className="text-xl font-extrabold text-red-500 mt-1">{incorrectCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8FD] border border-[#F0E5FF]">
              <p className="text-[11px] font-bold uppercase text-[#82837C]">Accuracy</p>
              <p className="text-xl font-extrabold text-[#9718FB] mt-1">{averageScore}%</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleRetry}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#FAF5FF] hover:bg-[#F4E6FF] text-[#9718FB] border border-[#E9D5FF] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Session</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#9718FB] hover:bg-[#830EE4] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Breakdown */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-[#1E0532]">
              Detailed Question Analysis
            </h3>
            <span className="text-xs text-[#82837C]">AI Feedback Breakdown</span>
          </div>

          <div className="space-y-4">
            {evalResults.map((result, index) => (
              <div 
                key={index}
                className="bg-white border border-[#EFE5FC] rounded-2xl p-6 shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#FAF5FF] text-[#9718FB] text-xs font-bold flex items-center justify-center border border-[#F0E5FF]">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#82837C]">
                      Question
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      result.isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {result.isCorrect ? 'Mastered' : 'Needs Review'}
                    </span>
                    <span className="text-xs font-extrabold text-[#9718FB] bg-[#FAF5FF] px-2.5 py-0.5 rounded-full border border-[#F0E5FF]">
                      {result.score}/100
                    </span>
                  </div>
                </div>

                {/* Question */}
                <p className="font-semibold text-base text-[#1E0532]">
                  {result.question}
                </p>

                {/* Submitted Answer */}
                <div className="p-3.5 rounded-xl bg-[#FAF8FD] border border-gray-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#82837C]">
                    Your Submitted Answer
                  </p>
                  <p className="text-xs text-[#1E0532] italic">
                    "{result.answer}"
                  </p>
                </div>

                {/* AI Tutor Feedback */}
                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9718FB]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>OMINI-Study AI Tutor Assessment</span>
                  </div>
                  <p className="text-xs text-[#6A6A7A] leading-relaxed">
                    {result.feedback}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-[#82837C] border-t border-[#F0E5FF] bg-white">
        © {new Date().getFullYear()} OMINI-Study • The #1 AI Study Tool for Students
      </footer>
    </div>
  );
}
