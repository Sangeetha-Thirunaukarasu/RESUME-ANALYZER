import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Upload, Briefcase, Play, FileText, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import CircularScore from '../components/CircularScore';
import FeedbackCard from '../components/FeedbackCard';

const API_BASE_URL = "https://resume-analyzer-api.onrender.com/api/v1";

export const Workspace: React.FC = () => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "processing" | "completed" | "failed">("idle");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdRef = useRef<HTMLTextAreaElement>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
      setError(null);
    }
  };

  const startPolling = (taskId: string) => {
    let delay = 1500;
    const poll = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/analyze/status/${taskId}`);
        const currentStatus = response.data.status;

        if (currentStatus === "completed") {
          const resultsResponse = await axios.get(`${API_BASE_URL}/analyze/results/${taskId}`);
          setResults(resultsResponse.data);
          setStatus("completed");
          if (pollingIntervalRef.current) window.clearTimeout(pollingIntervalRef.current);
        } else if (currentStatus === "failed") {
          setError(response.data.error_message || "An internal parsing anomaly occurred.");
          setStatus("failed");
          if (pollingIntervalRef.current) window.clearTimeout(pollingIntervalRef.current);
        } else {
          setStatus("processing");
          delay = Math.min(delay * 1.5, 8000);
          pollingIntervalRef.current = window.setTimeout(poll, delay);
        }
      } catch (err: any) {
        setError("Network polling connection dropped temporarily.");
        setStatus("failed");
        if (pollingIntervalRef.current) window.clearTimeout(pollingIntervalRef.current);
      }
    };
    pollingIntervalRef.current = window.setTimeout(poll, delay);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !jdRef.current?.value.trim()) {
      setError("Please ensure both file and description blocks are filled.");
      return;
    }

    setError(null);
    setResults(null);
    setStatus("pending");

    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);
    formData.append("job_description", jdRef.current.value);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      startPolling(response.data.task_id);
    } catch (err: any) {
      setStatus("failed");
      setError(err.response?.data?.detail || "Network transmission failure occurred during initialization.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Dynamic Header Block */}
      <header className="border-b border-slate-800/60 pb-4 text-center">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent sm:text-4xl">
          AI Resume Analyzer
        </h1>
        <p className="text-sm text-slate-400 mt-1.5 font-medium">
          Instantly check how well your resume matches any job description and get tailored suggestions to beat Applicant Tracking Systems (ATS).
        </p>
      </header>

      {/* Primary Fixed Screen Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* === LEFT COLUMN: FIXED FORM INPUTS TIER (Spans 5 Columns) === */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 space-y-4 flex flex-col justify-between h-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex-1">
            
            {/* Upload Box Component */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload Resume</span>
              </h2>
              <div className="relative group border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-xl p-5 transition-all bg-slate-950/40 text-center flex flex-col items-center justify-center min-h-[130px]">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required
                />
                <div className="space-y-2 pointer-events-none">
                  <Upload className="w-7 h-7 text-slate-500 group-hover:text-cyan-400 mx-auto transition-colors" />
                  <p className="text-xs font-semibold text-slate-300">
                    {selectedFileName ? (
                      <span className="text-cyan-400 font-mono text-xs break-all">{selectedFileName}</span>
                    ) : (
                      "Drag & drop resume here, or browse"
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500">PDF or DOCX layout models up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Job Requirements Input Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>Target Job Description</span>
              </label>
              <textarea 
                ref={jdRef}
                placeholder="Paste the target job requirements or description parameters here..."
                className="w-full h-[260px] rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs leading-relaxed text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-sans resize-none"
                required
              />
            </div>

            {/* Action Launch Button */}
            <button 
              type="submit" 
              disabled={status === "pending" || status === "processing"}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/10 transition-all transform active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Analyze My Resume</span>
            </button>
          </div>

          {/* Localized Error Messages Layer */}
          {error && (
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-400 text-xs font-medium flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* === RIGHT COLUMN: SYNCHRONIZED RESULTS INSIGHTS SCREEN (Spans 8 Columns) === */}
        <main className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl min-h-[520px] flex flex-col justify-center">
          
          {status === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center py-12 space-y-3">
              <FileText className="w-12 h-12 stroke-[1.25]" />
              <p className="text-sm font-medium tracking-wide max-w-sm mx-auto">Provide your resume file and target job specification parameters on the left to activate data evaluations.</p>
            </div>
          )}

          {(status === "pending" || status === "processing") && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin stroke-[1.5]" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white tracking-wide">Analyzing your profile layers...</p>
                <p className="text-[11px] text-slate-500 font-mono">Status Check: <span className="text-cyan-400">Processing Pipeline</span></p>
              </div>
            </div>
          )}

          {status === "completed" && results && (
            <div className="space-y-6 animate-fadeIn w-full flex-1 flex flex-col justify-between">
              
              {/* Top Section Layout: Gauge Profile on Left, Skills Blocks on Right */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Progress Wheel Stack Layer: Shifted to its own clean, centered box layout */}
                <div className="md:col-span-5 bg-slate-950/30 border border-slate-800/40 p-5 rounded-xl flex flex-col items-center justify-center text-center space-y-3 min-h-[190px]">
                  <CircularScore score={results.match_score} />
                </div>
                
                {/* Keywords Analysis Layer: Maximized to fill the remaining 7 columns with zero text clipping */}
                <div className="md:col-span-7 space-y-2.5">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500">Keyword Analytics Matching Density</h4>
                  
                  <div className="space-y-2">
                    {/* Matching Skills Data Box Container */}
                    <div className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" /> <span>Matching Skills</span>
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-[54px] overflow-y-auto pr-1 custom-scrollbar">
                        {results.keywords.found.map((kw: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-500/5 text-emerald-400/90 rounded border border-emerald-500/10 text-[11px] font-medium font-sans">{kw}</span>
                        ))}
                        {results.keywords.found.length === 0 && <span className="text-xs text-slate-600 italic">No matching keywords isolated.</span>}
                      </div>
                    </div>
                    
                    {/* Missing Critical Skills Data Box Container */}
                    <div className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" /> <span>Missing Critical Skills</span>
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-[54px] overflow-y-auto pr-1 custom-scrollbar">
                        {results.keywords.missing.map((kw: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-500/5 text-rose-400/90 rounded border border-rose-500/10 text-[11px] font-medium font-sans">{kw}</span>
                        ))}
                        {results.keywords.missing.length === 0 && <span className="text-xs text-slate-600 italic">No missing skills detected in file scope!</span>}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Section Matrix: Improvement Suggestions Accordions */}
              <div className="space-y-3 pt-4 border-t border-slate-800/60 flex-1 flex flex-col justify-start">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                  Improvement Suggestions
                </h4>
                <div className="space-y-2.5 max-h-[230px] overflow-y-auto pr-1 custom-scrollbar flex-1">
                  {results.structural_feedback.map((fb: { section: string; issue: string; suggestion: string }, i: number) => (
                    <FeedbackCard 
                      key={i} 
                      section={fb.section} 
                      issue={fb.issue} 
                      suggestion={fb.suggestion} 
                    />
                  ))}
                </div>
              </div>

            </div>
          )}
        </main>

      </div>
    </div>
  );
};
