"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { useCenturion } from '@/hooks/useCenturion';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface Task {
  id: string;
  text: string;
  done: boolean;
  deadline?: string;
}

export const Tasks = () => {
  const { playThock } = useAudio();
  const { speak } = useCenturion();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem('monolith_v2_tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('monolith_v2_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleAddTask = (e: any) => {
      const text = e.detail.text;
      if (!text.trim()) return;
      setTasks(prev => {
        if (prev.length >= 6) return prev;
        return [{
          id: Date.now().toString(),
          text: text.toUpperCase(),
          done: false
        }, ...prev];
      });
    };
    const handleClearTasks = (e: any) => {
      if (e.detail.action === 'all') setTasks([]);
    };
    window.addEventListener('monolith-task-add' as any, handleAddTask);
    window.addEventListener('monolith-task-clear' as any, handleClearTasks);
    return () => {
      window.removeEventListener('monolith-task-add' as any, handleAddTask);
      window.removeEventListener('monolith-task-clear' as any, handleClearTasks);
    };
  }, []);

  const addTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || tasks.length >= 6) return;
    playThock();
    const newTask: Task = {
      id: Date.now().toString(),
      text: input.toUpperCase(),
      done: false,
      deadline: selectedDate ? selectedDate.toISOString() : undefined
    };
    setTasks([newTask, ...tasks]);
    setInput('');
    setSelectedDate(undefined);
  };

  const toggleTask = (id: string) => {
    playThock();
    const task = tasks.find(t => t.id === id);
    if (task && !task.done) {
      speak(`Task completed: ${task.text}`, true);
    }
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playThock();
    setTasks(tasks.filter(t => t.id !== id));
  };

  const clearAll = () => {
    playThock();
    setTasks([]);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center flex-shrink-0">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Rain's Cloud</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-6 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-destructive hover:bg-transparent"
        >
          CLEAR ALL
        </Button>
      </div>

      <form onSubmit={addTask} className="flex flex-col gap-2 flex-shrink-0">
        <div className="relative group">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={tasks.length >= 6 ? "CLOUD FULL" : "A NEW THOUGHT..."}
            disabled={tasks.length >= 6}
            className="bg-white/5 border-white/10 h-10 font-bold tracking-widest uppercase focus:border-primary text-[10px] px-4 rounded-xl transition-all pr-12"
          />
          <Popover onOpenChange={(open) => open && playThock()}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-all outline-none",
                  selectedDate ? "text-primary" : "text-white/20 hover:text-white/60"
                )}
              >
                <CalendarIcon size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#0A0A0B] border border-white/20 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[200]"
              align="end"
              sideOffset={8}
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || tasks.length >= 6}
          className="brutalist-button h-10 bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white gap-2 rounded-xl transition-all"
        >
          <span className="text-[9px] font-black tracking-[0.2em] uppercase">Add to thoughts</span>
          <ArrowUpRight size={14} />
        </Button>
      </form>

      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              "group flex items-center gap-3 p-3 border border-white/10 transition-all cursor-pointer relative overflow-hidden rounded-xl",
              task.done ? "opacity-20 border-white/5" : "bg-white/5 hover:bg-white/10 hover:border-white/20"
            )}
            onClick={() => toggleTask(task.id)}
          >
            <div className="absolute left-0 top-0 h-full w-0.5 bg-primary/20 group-hover:bg-primary transition-colors" />
            <div className="flex flex-col items-center justify-center min-w-[20px]">
              <span className="text-[7px] font-mono text-white/20 mb-0.5 leading-none">{index + 1}</span>
              {task.done ? <CheckCircle2 size={14} className="text-primary" /> : <Circle size={14} className="text-white/40" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <span className={cn(
                "text-[9px] font-black tracking-widest uppercase truncate transition-all",
                task.done && "line-through text-white/40"
              )}>
                {task.text}
              </span>
              {task.deadline && (
                <span className="text-[7px] font-mono text-primary/60 uppercase mt-0.5 flex items-center gap-1">
                  <CalendarIcon size={8} /> {format(new Date(task.deadline), "dd MMM yyyy")}
                </span>
              )}
            </div>

            <DropdownMenu onOpenChange={(open) => open && playThock()}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="text-white/40 group-hover:text-primary transition-all p-1 outline-none">
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0A0A0B] border-white/20 rounded-xl p-1">
                <DropdownMenuItem
                  onClick={(e) => deleteTask(task.id, e as any)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer rounded-none"
                >
                  <Trash2 size={12} /> DELETE OBJECTIVE
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-5 select-none py-12">
            <CheckCircle2 size={64} strokeWidth={1} />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] mt-4">Buffer Clear</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center flex-shrink-0 pt-2 border-t border-white/5">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">System Load</span>
          <span className="text-[7px] font-mono text-white/10 uppercase">Capacity: {tasks.length}/6 Sessions</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn("w-3 h-1 transition-all rounded-full", i < tasks.length ? "bg-primary" : "bg-white/5")} />
          ))}
        </div>
      </div>
    </div>
  );
};
