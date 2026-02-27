'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAudio } from '@/context/AudioContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeftRight,
  Copy, 
  Loader2, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Timer,
  History,
  Trash2,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: string;
  type: 'send' | 'receive';
  content: string;
  timestamp: number;
}

export const PortalInterface = ({ isStandalone = false }: { isStandalone?: boolean }) => {
  const { playThock, playSuccess } = useAudio();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('send');
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const [peer, setPeer] = useState<Peer | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'initializing' | 'waiting' | 'connecting' | 'receiving' | 'complete' | 'error'>('idle');
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [sendContent, setSendContent] = useState('');
  const [receivedContent, setReceivedContent] = useState('');

  const connRef = useRef<DataConnection | null>(null);
  const ttlIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('monolith_v2_portal_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addToHistory = (type: 'send' | 'receive', content: string) => {
    const newItem: HistoryItem = { id: Date.now().toString(), type, content, timestamp: Date.now() };
    const updatedHistory = [newItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('monolith_v2_portal_history', JSON.stringify(updatedHistory));
  };

  const cleanup = () => {
    if (connRef.current) { try { connRef.current.close(); } catch (e) {} connRef.current = null; }
    if (peer) { try { peer.disconnect(); peer.destroy(); } catch (e) {} setPeer(null); }
    if (ttlIntervalRef.current) clearInterval(ttlIntervalRef.current);
    setStatus('idle');
    setTimeLeft(null);
    setCode('');
  };

  useEffect(() => {
    if (status === 'waiting' && timeLeft !== null) {
      ttlIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            cleanup();
            toast({ variant: 'destructive', title: "BRIDGE EXPIRED", description: "The 5-minute security window has closed." });
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else {
      if (ttlIntervalRef.current) clearInterval(ttlIntervalRef.current);
    }
    return () => { if (ttlIntervalRef.current) clearInterval(ttlIntervalRef.current); };
  }, [status, timeLeft, toast]);

  const handleSendInitialize = () => {
    if (!sendContent.trim()) return;
    cleanup();
    playThock();
    setStatus('initializing');
    const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const peerId = `MONOLITH_PORTAL_V2_${newCode}`;
    const newPeer = new Peer(peerId);
    newPeer.on('open', () => { setPeer(newPeer); setCode(newCode); setStatus('waiting'); setTimeLeft(300); });
    newPeer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('open', () => {
        conn.send({ type: 'PORTAL_TRANSFER', content: sendContent });
        playSuccess();
        addToHistory('send', sendContent);
        setStatus('complete');
      });
    });
    newPeer.on('error', () => setStatus('error'));
  };

  const handleReceiveConnect = () => {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length < 4) return;
    
    cleanup();
    playThock();
    setStatus('connecting');
    const targetId = `MONOLITH_PORTAL_V2_${normalizedCode.slice(0, 4)}`;
    const newPeer = new Peer();
    newPeer.on('open', () => {
      setPeer(newPeer);
      const conn = newPeer.connect(targetId, { reliable: true });
      connRef.current = conn;
      conn.on('open', () => setStatus('receiving'));
      conn.on('data', (data: any) => {
        if (data?.type === 'PORTAL_TRANSFER') {
          setReceivedContent(data.content);
          playSuccess();
          addToHistory('receive', data.content);
          setStatus('complete');
        }
      });
      conn.on('error', () => setStatus('error'));
    });
    newPeer.on('error', () => setStatus('error'));
  };

  const handleTabChange = (val: string) => {
    playThock();
    cleanup();
    setActiveTab(val);
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    playThock();
    toast({ description: "DATA COPIED TO CLIPBOARD" });
  };

  return (
    <div className={cn("flex flex-col h-full overflow-hidden w-full bg-[#0A0A0B]", !isStandalone && "max-h-[80vh]")}>
      <div className="mb-6 flex justify-between items-center px-4 pt-4 md:pt-0">
        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
          <Zap size={18} /> SYSTEM DATA BRIDGE
        </h3>
        <Button variant="ghost" size="icon" onClick={() => { playThock(); setHistoryOpen(!historyOpen); }} className={cn("w-12 h-12 border border-white/5", historyOpen && "text-primary border-primary/20")}>
          <History size={20} />
        </Button>
      </div>

      {historyOpen ? (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-top-4 px-4 pb-10">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setHistoryOpen(false)}><ChevronLeft size={14} /></Button>
               Buffer History
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setHistory([]); localStorage.removeItem('monolith_v2_portal_history'); }} className="h-8 text-[9px] font-black uppercase tracking-widest text-destructive">PURGE</Button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {history.map((item) => (
              <div key={item.id} className="p-4 border border-white/5 bg-white/2 flex flex-col gap-2 relative group">
                <div className="flex justify-between items-center">
                  <span className={cn("px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border", item.type === 'send' ? "border-primary text-primary" : "border-white/20 text-white/40")}>{item.type}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white/20 hover:text-primary transition-colors" 
                    onClick={() => handleCopy(item.content)}
                  >
                    <Copy size={12} />
                  </Button>
                </div>
                <p className="text-xs font-mono text-white/60 line-clamp-2 break-all">{item.content}</p>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-12 opacity-20 text-[10px] font-black uppercase tracking-widest">No previous logs</div>
            )}
          </div>
          <Button onClick={() => setHistoryOpen(false)} className="mt-8 h-14 brutalist-button text-[12px]">RETURN</Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1 mb-4 md:mb-8 h-16 mx-auto max-w-sm px-1 flex-shrink-0">
            <TabsTrigger value="send" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase font-black tracking-widest text-[12px] h-full transition-all">SEND</TabsTrigger>
            <TabsTrigger value="receive" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase font-black tracking-widest text-[12px] h-full transition-all">RECEIVE</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden flex flex-col px-4 pb-10">
            <TabsContent value="send" className="mt-0 flex-1 flex flex-col outline-none">
              {status === 'complete' ? (
                <div className="flex flex-col items-center justify-center space-y-6 text-center flex-1 animate-in fade-in">
                  <CheckCircle2 size={64} className="text-primary" />
                  <h3 className="text-2xl font-black uppercase tracking-[0.2em]">TRANSFERRED</h3>
                  <Button onClick={cleanup} className="brutalist-button h-14 px-12 text-[12px]">RESET</Button>
                </div>
              ) : status === 'waiting' ? (
                <div className="flex flex-col items-center justify-center space-y-12 text-center flex-1 animate-in zoom-in-95">
                  <span className="text-[12px] font-black uppercase tracking-[1em] text-white/40">ACCESS CODE</span>
                  <div className="text-7xl font-black tracking-[0.4em] text-primary border-b-4 border-primary pb-4 font-mono">{code}</div>
                  <div className="flex items-center gap-4 px-8 py-3 bg-primary/10 border border-primary/20 text-primary">
                    <Timer size={20} className="animate-pulse" />
                    <span className="text-[14px] font-black uppercase tracking-widest">TTL: {Math.floor(timeLeft! / 60)}:{(timeLeft! % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <Button variant="outline" onClick={cleanup} className="h-14 border-white/10 text-white/40 uppercase font-black text-[12px] px-12">ABORT BRIDGE</Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in flex-1 flex flex-col pb-8">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">DATA BUFFER</label>
                  <Textarea 
                    value={sendContent} 
                    onChange={(e) => setSendContent(e.target.value)} 
                    placeholder="PASTE DATA PACKET..." 
                    className="bg-white/5 border-white/10 flex-1 font-mono text-sm tracking-tight focus:border-primary resize-none p-6 text-white" 
                  />
                  <Button 
                    onClick={handleSendInitialize} 
                    disabled={!sendContent || status === 'initializing'} 
                    className="w-full h-16 brutalist-button text-[14px]"
                  >
                    {status === 'initializing' ? <Loader2 className="animate-spin" /> : 'INITIALIZE UPLINK'}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="receive" className="mt-0 flex-1 flex flex-col outline-none h-full">
              {status === 'complete' ? (
                <div className="space-y-6 animate-in fade-in flex-1 flex flex-col pb-8">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-[12px] font-black uppercase tracking-widest text-primary">DECRYPTED DATA</span>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(receivedContent)} className="h-10 gap-2 text-white/40 hover:text-primary uppercase font-black text-[10px]"><Copy size={14} /> COPY</Button>
                  </div>
                  <Textarea readOnly value={receivedContent} className="bg-white/5 border-white/10 flex-1 font-mono text-sm tracking-tight p-6 text-white" />
                  <Button onClick={cleanup} className="w-full h-14 border-white/10 bg-white/5 hover:bg-white/10 uppercase font-black text-[12px]">DISCONNECT</Button>
                </div>
              ) : status === 'error' ? (
                <div className="flex flex-col items-center justify-center space-y-6 text-center flex-1 animate-in fade-in">
                  <AlertCircle size={64} className="text-destructive" />
                  <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-destructive">LINK FAILED</h3>
                  <Button onClick={cleanup} className="brutalist-button h-14 px-12 text-[12px]">RETRY</Button>
                </div>
              ) : (status === 'connecting' || status === 'receiving') ? (
                <div className="flex flex-col items-center justify-center space-y-6 text-center flex-1 animate-in fade-in">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <h3 className="text-2xl font-black uppercase tracking-[0.2em]">{status === 'receiving' ? 'DECRYPTING...' : 'ESTABLISHING BRIDGE...'}</h3>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 animate-in fade-in pb-12">
                  <div className="w-full space-y-4">
                    <label className="text-[12px] font-black uppercase tracking-[0.5em] text-white/40">ENTER UPLINK CODE</label>
                    <Input 
                      value={code} 
                      onChange={(e) => setCode(e.target.value.toUpperCase().trim().slice(0, 5))} 
                      placeholder="____" 
                      className="bg-white/5 border-white/10 h-24 md:h-32 font-black text-center text-5xl md:text-6xl tracking-[0.5em] focus:border-primary font-mono w-full max-w-sm mx-auto rounded-none border-2" 
                    />
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                      *Smart-trim active. Trailing space permitted.
                    </p>
                  </div>
                  <Button 
                    onClick={handleReceiveConnect} 
                    disabled={code.trim().length < 4} 
                    className="w-full h-20 brutalist-button text-[16px] max-w-sm"
                  >
                    EXECUTE DOWNLINK
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
};

export const Portal = ({ children }: { children?: React.ReactNode }) => {
  const { playThock } = useAudio();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (open) playThock(); }}>
      <DialogTrigger asChild>
        {children || (
          <button className="flex flex-col h-full w-full justify-center items-center gap-2 group outline-none">
            <div className="w-14 h-14 rounded-full border-2 border-primary/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
              <ArrowLeftRight size={24} className="text-white/40 group-hover:text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-primary transition-colors">P2P Bridge</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#0A0A0B] border-white/20 p-0 md:p-8 max-w-[100vw] md:max-w-[75vw] w-full h-full md:h-auto max-h-screen md:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-4 md:p-0">
          <DialogTitle className="text-sm font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
             <Zap size={18} /> SYSTEM DATA BRIDGE
          </DialogTitle>
        </DialogHeader>
        <PortalInterface />
      </DialogContent>
    </Dialog>
  );
};
