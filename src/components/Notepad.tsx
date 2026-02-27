'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Bold,
  Italic,
  Eraser,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  AlertTriangle,
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

interface NotepadProps {
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const Notepad = ({ isMaximized = false, onToggleMaximize }: NotepadProps) => {
  const { playKey, playThock } = useAudio();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('MONOLITH_LOG');
  const [isSyncing, setIsSyncing] = useState(false);
  const purgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('monolith_v2_notepads_content');
    if (saved && editorRef.current) {
      editorRef.current.innerHTML = saved;
    }

    const handleAITask = async (e: any) => {
      const { action, prompt, instruction } = e.detail;
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

      if (!apiKey || !editorRef.current) return;

      setIsSyncing(true);
      try {
        const currentText = editorRef.current.innerText || "";
        let systemMsg = "";

        if (action === 'rewrite') {
          systemMsg = `You are an expert editor. Rewrite the following text based on this instruction: ${instruction || "Improve style"}. Respond ONLY with the rewritten text. No preamble.`;
        } else if (action === 'answer') {
          systemMsg = `You are Rain, an intuitive assistant. Read the provided text and answer any questions found in it. If there are no questions, provide a very brief summary of the content. Keep it short, witty, and gentle.`;
        } else {
          systemMsg = `You are a creative assistant. Generate text based on this prompt: ${prompt || "Write something interesting"}. Respond ONLY with the generated text. No preamble.`;
        }

        const userMsg = action === 'rewrite'
          ? `CONTENT TO REWRITE: ${currentText}\n\nINSTRUCTION: ${instruction}`
          : action === 'answer'
            ? `NOTEPAD CONTENT: ${currentText}`
            : `PROMPT: ${prompt}`;

        const finalUserContent = userMsg.trim() || "Please assist with drafting.";

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "model": "llama-3.3-70b-versatile",
            "messages": [
              { "role": "system", "content": systemMsg },
              { "role": "user", "content": finalUserContent }
            ],
            "temperature": 0.7
          })
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({ error: { message: "Internal API Error" } }));
          console.error("Notepad AI Failure Response:", errorPayload);
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices?.length) throw new Error("Null response");

        const result = data.choices[0].message.content;

        if (action === 'rewrite') {
          editorRef.current.innerHTML = result.replace(/\n/g, '<br>');
        } else if (action === 'answer') {
          // For "answer", we want the assistant to SPEAK it instead of just writing it
          window.dispatchEvent(new CustomEvent('monolith-subtitle', { detail: { text: result, isUser: false } }));
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(result));
        } else {
          editorRef.current.innerHTML += `<p>${result.replace(/\n/g, '<br>')}</p>`;
        }
        saveToStorage();
      } catch (err) {
        console.error("Notepad AI Tactical Error:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    window.addEventListener('monolith-notepad' as any, handleAITask);
    return () => window.removeEventListener('monolith-notepad' as any, handleAITask);
  }, []);

  const saveToStorage = () => {
    if (editorRef.current) {
      setIsSyncing(true);
      localStorage.setItem('monolith_v2_notepads_content', editorRef.current.innerHTML);
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleInput = () => {
    saveToStorage();
    playKey();
  };

  const execCommand = (command: string, value?: string) => {
    playThock();
    if (command === 'formatBlock') {
      document.execCommand(command, false, `<${value}>`);
    } else {
      document.execCommand(command, false, value);
    }
    saveToStorage();
    editorRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        execCommand('bold');
      } else if (e.key === 'i') {
        e.preventDefault();
        execCommand('italic');
      }
    }
  };

  const applyHighlight = (colorHex: string) => {
    playThock();
    document.execCommand('hiliteColor', false, colorHex);
    saveToStorage();
  };

  const clearHighlight = () => {
    playThock();
    document.execCommand('hiliteColor', false, 'transparent');
    saveToStorage();
  };

  const handlePurgeRequest = () => {
    playThock();
    if (!purgeConfirm) {
      setPurgeConfirm(true);
      if (purgeTimerRef.current) clearTimeout(purgeTimerRef.current);
      purgeTimerRef.current = setTimeout(() => setPurgeConfirm(false), 2000);
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        saveToStorage();
      }
      setPurgeConfirm(false);
    }
  };

  const generatePDF = () => {
    if (!editorRef.current) return;
    playThock();
    const doc = new jsPDF();
    const elements = Array.from(editorRef.current.childNodes);
    let y = 20;
    doc.setFont("helvetica", "normal");
    elements.forEach((node) => {
      const el = node as HTMLElement;
      const text = el.innerText || el.textContent || '';
      if (!text.trim()) return;
      if (el.tagName === 'H1') { doc.setFontSize(26); doc.setFont("helvetica", "bold"); }
      else if (el.tagName === 'H2') { doc.setFontSize(20); doc.setFont("helvetica", "bold"); }
      else { doc.setFontSize(11); doc.setFont("helvetica", "normal"); }
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 15, y);
      y += (lines.length * 7) + 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`${fileName.replace(/\s+/g, '_').toUpperCase()}.pdf`);
    setDownloadDialogOpen(false);
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-full w-full bg-[#050506]/60 backdrop-blur-2xl border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* MINIMALIST HEADER */}
      <div className="h-16 flex-shrink-0 flex justify-between items-center px-8 border-b border-white/[0.03]">
        <div className="flex items-center gap-4">
          <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", isSyncing ? "bg-primary animate-pulse scale-150" : "bg-white/10")} />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Scratchpad_Core</span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleMaximize && (
            <button onClick={() => { playThock(); onToggleMaximize?.(); }} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 text-white/20 hover:text-white transition-all rounded-sm">
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* CONSOLIDATED TOOLS BAR */}
      <div className="px-4 md:px-8 py-3 flex flex-wrap items-center gap-1 border-b border-white/[0.03] bg-white/[0.01]">
        <div className="flex items-center">
          <button onClick={() => execCommand('bold')} className="w-9 h-9 flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-white transition-all"><Bold size={13} /></button>
          <button onClick={() => execCommand('italic')} className="w-9 h-9 flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-white transition-all"><Italic size={13} /></button>
        </div>

        <div className="w-[1px] h-4 bg-white/10 mx-1 md:mx-2" />

        <div className="flex items-center">
          <button onClick={() => execCommand('formatBlock', 'h1')} className="px-2.5 h-9 flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-primary text-[8px] font-black tracking-widest uppercase transition-all">TITLE</button>
          <button onClick={() => execCommand('formatBlock', 'h2')} className="px-2.5 h-9 flex items-center justify-center hover:bg-white/5 text-white/40 hover:text-primary text-[8px] font-black tracking-widest uppercase transition-all">SUB</button>
        </div>

        <div className="w-[1px] h-4 bg-white/10 mx-1 md:mx-2" />

        <DropdownMenu onOpenChange={(open) => open && playThock()}>
          <DropdownMenuTrigger asChild>
            <button className="px-3 h-9 flex items-center gap-2 hover:bg-white/5 text-white/40 hover:text-white text-[8px] font-black tracking-widest uppercase transition-all">
              <AlignLeft size={11} /> ALIGN
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0A0A0B] border-white/20 p-1 min-w-[140px] rounded-none">
            <DropdownMenuItem onClick={() => execCommand('justifyLeft')} className="gap-3 text-[9px] font-black uppercase tracking-widest py-3 px-4 focus:bg-primary/20 focus:text-primary"><AlignLeft size={14} /> LEFT</DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand('justifyCenter')} className="gap-3 text-[9px] font-black uppercase tracking-widest py-3 px-4 focus:bg-primary/20 focus:text-primary"><AlignCenter size={14} /> CENTER</DropdownMenuItem>
            <DropdownMenuItem onClick={() => execCommand('justifyRight')} className="gap-3 text-[9px] font-black uppercase tracking-widest py-3 px-4 focus:bg-primary/20 focus:text-primary"><AlignRight size={14} /> RIGHT</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-[1px] h-4 bg-white/10 mx-1 md:mx-2" />

        <div className="flex items-center gap-2 px-1">
          {[{ id: 'p', color: '#ffb7c5' }, { id: 'c', color: '#e0b0ff' }].map(h => (
            <button key={h.id} onClick={() => applyHighlight(h.color)} className="w-2.5 h-2.5 rounded-full border border-white/10 hover:scale-125 transition-transform" style={{ backgroundColor: h.color }} />
          ))}
          <button onClick={clearHighlight} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 text-white/20 hover:text-white"><Eraser size={13} /></button>

          <div className="w-[1px] h-4 bg-white/10 mx-1 md:mx-2" />

          <button onClick={() => { playThock(); setDownloadDialogOpen(true); }} className="w-9 h-9 flex items-center justify-center hover:bg-white/5 text-primary transition-all border border-transparent hover:border-primary/20 bg-primary/5">
            <Download size={13} />
          </button>
          <button onClick={handlePurgeRequest} className={cn(
            "w-9 h-9 flex items-center justify-center transition-all border",
            purgeConfirm ? "bg-red-500 border-red-500 text-white animate-pulse" : "border-transparent text-white/20 hover:text-red-500 hover:border-red-500/30 bg-white/5"
          )}>
            {purgeConfirm ? <AlertTriangle size={13} /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>

      {/* ZEN EDITOR */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-12 py-10">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={saveToStorage}
          className={cn(
            "w-full min-h-full bg-transparent outline-none border-none selection:bg-primary/20",
            "prose prose-invert max-w-none break-words font-sans selection:text-white",
            "prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tight prose-h1:mb-10 prose-h1:mt-0 prose-h1:text-white",
            "prose-h2:text-2xl prose-h2:font-extrabold prose-h2:tracking-tight prose-h2:mb-6 prose-h2:mt-12 prose-h2:text-white/90 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-2",
            "prose-p:text-lg prose-p:font-normal prose-p:leading-relaxed prose-p:mb-6 prose-p:text-white/60"
          )}
          spellCheck={false}
        />
      </div>

      {/* EXPORT DIALOG */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="bg-[#050506] border-white/10 p-8 max-w-sm rounded-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">SAVE ARCHIVE</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/20">IDENTIFICATION_TAG</label>
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} className="bg-white/5 border-white/10 h-14 font-mono text-sm focus:border-primary/50 uppercase rounded-none" />
            </div>
            <div className="flex gap-2 h-14">
              <Button onClick={() => setDownloadDialogOpen(false)} variant="ghost" className="flex-1 h-full text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white">ABORT</Button>
              <Button onClick={generatePDF} className="flex-1 h-full bg-primary text-white hover:opacity-90 font-black text-[9px] tracking-widest uppercase rounded-none">COMMIT</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
