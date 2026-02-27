"use client";

import { useCallback } from 'react';

const dispatchSubtitle = (text: string, isUser = false) => {
    window.dispatchEvent(new CustomEvent('monolith-subtitle', {
        detail: { text, isUser }
    }));
};

let globalRecognition: any = null;
let chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];

export const useCenturion = () => {
    const speak = useCallback((text: string, priority = false) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        console.log("Rain speaking:", text);

        if (priority) window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        const getVoice = () => {
            const voices = window.speechSynthesis.getVoices();

            // LOG ALL VOICES: This helps us see what your system actually has
            if (voices.length > 0 && !window.hasOwnProperty('__voices_logged')) {
                console.log("--- SYSTEM VOCAL MODELS ---");
                voices.filter(v => v.lang.startsWith('en')).forEach(v => console.log(`Model: ${v.name} | Local: ${v.localService}`));
                (window as any).__voices_logged = true;
            }

            // Priority: High-Fidelity voices that lean toward a more youthful/female profile
            const preferred = [
                'Microsoft Sonia Natural', 'Microsoft Aria Natural', 'Microsoft Jenny Natural',
                'Google US English Female', 'Google UK English Female', 'Sonia', 'Aria', 'Samantha'
            ];

            for (const pattern of preferred) {
                const found = voices.find(v => v.name.includes(pattern) && v.lang.startsWith('en'));
                if (found) return found;
            }

            return voices.find(v => v.name.toLowerCase().includes('female') && v.lang.startsWith('en')) ||
                voices.find(v => v.lang.startsWith('en')) ||
                voices[0];
        };

        const voice = getVoice();
        if (voice) {
            utterance.voice = voice;
            console.log("Vocal Matrix Active | Persona: Rain (Soft-Teen) | Model:", voice.name);
        }

        // TEEN GIRL PROFILE: 1.15 pitch provides youth without robotic distortion
        utterance.pitch = 1.15;
        utterance.rate = 0.98;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            window.dispatchEvent(new CustomEvent('monolith-speaking', { detail: { active: true } }));
        };

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const word = text.substring(event.charIndex, text.indexOf(' ', event.charIndex + 1) === -1 ? undefined : text.indexOf(' ', event.charIndex + 1));
                const progressiveText = text.substring(0, event.charIndex + word.length);
                dispatchSubtitle(progressiveText, false);
            }
        };

        utterance.onend = () => {
            window.dispatchEvent(new CustomEvent('monolith-speaking', { detail: { active: false } }));
        };

        window.speechSynthesis.speak(utterance);
    }, []);



    const executeVoiceCommand = useCallback(async (transcript: string) => {
        const cmd = transcript.toLowerCase().trim();

        // Expanded phonetic variations for "Rain" and "Jarvis" (for compatibility)
        const beastAliases = [
            'rain', 'rayne', 'rainy', 'brain', 'rein', 'cane', 'lane', 'sane', 'wane', 'bane', 'fane', 'mane', 'thane', 'blain', 'swain', 'twain', 'sprain', 'strain', 'abstain', 'attain', 'complain', 'contain', 'detain', 'disdain', 'explain', 'maintain', 'obtain', 'pertain', 'refrain', 'remain', 'restain', 'retain', 'sustain', 'ordain', 'preordain', 'reordain', 'arraign', 'campaign', 'champagne', 'deign', 'feign', 'foreign', 'sovereign', 'dane', 'germane', 'humane', 'insane', 'mundane', 'profane', 'urbane', 'airplane', 'aquaplane', 'backplane', 'biplane', 'cellophane', 'counterpane', 'hydroplane', 'monoplane', 'seaplane', 'skisplane', 'tailplane', 'windowpane', 'birdbrain', 'harebrain', 'rattlebrain', 'scatterbrain', 'shatterbrain', 'eyestrain', 'constrain', 'restrain', 'distrain', 'overstrain', 'bloodstain', 'unstain', 'constrained', 'explained', 'remained', 'sustained', 'retained', 'attained', 'detained', 'disdained', 'refrained', 'contained', 'maintained', 'obtained', 'pertained', 'ordained', 'arraigned', 'deigned', 'feigned', 'rained', 'trained', 'drained', 'grained', 'planed', 'stained', 'chained', 'sprained', 'strained', 'Wayne', 'Blaine', 'Duane', 'Shane', 'Zane', 'Lorraine', 'Germaine',
            'jarvis', 'javis', 'javos', 'jarv', 'jarvies', 'jervis', 'travis', 'hey jarvis', 'hi jarvis', 'okay jarvis',
            'gavice', 'garvis', 'jarvis', 'charvis', 'jobless', 'service', 'service', 'javiers', 'javier', 'jovials',
            'garbage', 'jarvis', 'javos', 'java', 'darvis', 'javrez', 'jarvis', 'javs', 'jar', 'arvis', 'arbis', 'harvest'
        ];

        // Fuzzy match: If the transcript starts with a similar sound or contains a dense chunk of the word
        const hasWakeWord = beastAliases.some(alias => cmd.includes(alias)) ||
            (cmd.startsWith('j') && (cmd.includes('v') || cmd.includes('s'))) ||
            cmd.includes('arvis');

        console.log("BEAST HEARING ACTIVE | Captured:", cmd, "| Match Strength:", hasWakeWord);

        // Strictly require wake word
        if (!hasWakeWord) return;

        // INTERRUPT: Cancel any current speech when user speaks
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        dispatchSubtitle(transcript, true);

        // UI FEEDBACK
        window.dispatchEvent(new CustomEvent('monolith-speaking', { detail: { active: true } }));

        const { analyzeIntent } = await import('@/lib/ai-assistant');

        // Use history for smarter context
        const aiResponse = await analyzeIntent(transcript, chatHistory);
        console.log("AI Analysis Result:", aiResponse);

        // Update History
        chatHistory.push({ role: 'user', content: transcript });
        chatHistory.push({ role: 'assistant', content: aiResponse.response });
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

        // ALWAYS speak the response from the AI
        speak(aiResponse.response, true);

        if (aiResponse.intent !== 'UNKNOWN') {
            const { intent, parameter } = aiResponse;

            switch (intent) {
                case 'STOP_LISTENING':
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    stopListening();
                    break;
                case 'PLAY_MUSIC':
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target: 'player' } }));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('monolith-audio', { detail: { action: 'play' } })), 100);
                    break;
                case 'STOP_MUSIC':
                    window.dispatchEvent(new CustomEvent('monolith-audio', { detail: { action: 'pause' } }));
                    break;
                case 'NEXT_TRACK':
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target: 'player' } }));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('monolith-audio', { detail: { action: 'next' } })), 100);
                    break;
                case 'PREV_TRACK':
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target: 'player' } }));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('monolith-audio', { detail: { action: 'prev' } })), 100);
                    break;
                case 'NAVIGATE':
                    const targets: any = {
                        'buffer': 'notepad', 'bridge': 'portal', 'blackbox': 'archive'
                    };
                    const target = targets[parameter] || parameter;
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target } }));
                    break;
                case 'MAXIMIZE_NOTEPAD':
                    window.dispatchEvent(new CustomEvent('monolith-layout', { detail: { action: 'maximize_notepad', value: true } }));
                    break;
                case 'MINIMIZE_NOTEPAD':
                    window.dispatchEvent(new CustomEvent('monolith-layout', { detail: { action: 'maximize_notepad', value: false } }));
                    break;
                case 'ADD_TASK':
                    const taskText = typeof parameter === 'string' ? parameter : (parameter.text || parameter.content || transcript);
                    if (taskText) window.dispatchEvent(new CustomEvent('monolith-task-add', { detail: { text: taskText } }));
                    break;
                case 'CLEAR_TASKS':
                    window.dispatchEvent(new CustomEvent('monolith-task-clear', { detail: { action: 'all' } }));
                    break;
                case 'SET_TIMER':
                    const mins = typeof parameter === 'object' ? (parameter.minutes || parameter.mins) : parseInt(parameter);
                    window.dispatchEvent(new CustomEvent('monolith-timer', { detail: { mins: mins || 25 } }));
                    break;
                case 'LOCK_ARCHIVE':
                    window.dispatchEvent(new CustomEvent('monolith-archive', { detail: { action: 'lock', value: true } }));
                    break;
                case 'UNLOCK_ARCHIVE':
                    window.dispatchEvent(new CustomEvent('monolith-archive', { detail: { action: 'lock', value: false } }));
                    break;
                case 'BURN_NOTES':
                    window.dispatchEvent(new CustomEvent('monolith-archive', { detail: { action: 'burn' } }));
                    break;
                case 'BEAST_MODE':
                    window.dispatchEvent(new CustomEvent('monolith-beast', { detail: { active: parameter === true || parameter === 'true' } }));
                    break;
                case 'CODE_SESSION':
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target: 'atmosphere' } }));
                    window.dispatchEvent(new CustomEvent('monolith-timer', { detail: { mins: 25 } }));
                    setTimeout(() => window.dispatchEvent(new CustomEvent('monolith-audio', { detail: { action: 'play' } })), 500);
                    break;
                case 'SET_VOLUME':
                    const volData = typeof parameter === 'object' ? parameter : { value: parseFloat(parameter) / 100 };
                    window.dispatchEvent(new CustomEvent('monolith-volume', { detail: volData }));
                    break;
                case 'LIST_MUSIC':
                    const { getTracks } = await import('@/lib/db');
                    const tracks = await getTracks();
                    const trackList = tracks.length > 0
                        ? `The available acoustic sessions are: ${tracks.map(t => t.name).join(', ')}.`
                        : "The sonic core appears to be empty, Sir. No tracks are currently indexed.";
                    speak(trackList, true);
                    break;
                case 'NOTEPAD_GENERATE':
                    const genPrompt = typeof parameter === 'string' ? parameter : (parameter.prompt || parameter.text || transcript);
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target: 'notepad' } }));
                    window.dispatchEvent(new CustomEvent('monolith-notepad', { detail: { action: 'generate', prompt: genPrompt } }));
                    speak("Initializing cognitive drafting on the scratchpad, Sir.", true);
                    break;
                case 'NOTEPAD_REWRITE':
                    const rewInst = typeof parameter === 'string' ? parameter : (parameter.instruction || parameter.text || transcript);
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target: 'notepad' } }));
                    window.dispatchEvent(new CustomEvent('monolith-notepad', { detail: { action: 'rewrite', instruction: rewInst } }));
                    speak("Reconfiguring the current draft based on your specifications, Sir.", true);
                    break;
                case 'NOTEPAD_READ':
                    const noteContent = localStorage.getItem('monolith_v2_notepads_content');
                    if (noteContent) {
                        // Strip HTML for speech
                        const flatText = noteContent.replace(/<[^>]*>/g, ' ');
                        if (flatText.trim().length > 0) {
                            speak(`Accessing your scratchpad, Sir. The current log reads: ${flatText}`, false);
                        } else {
                            speak("Your scratchpad appears to be currently empty, Sir.", true);
                        }
                    } else {
                        speak("I cannot locate any active drafts in the current matrix, Sir.", true);
                    }
                    break;
                case 'NOTEPAD_ANSWER':
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target: 'notepad' } }));
                    window.dispatchEvent(new CustomEvent('monolith-notepad', { detail: { action: 'answer' } }));
                    speak("I'm analyzing the content of your scratchpad now, Sir. One moment.", true);
                    break;
                case 'PROTOCOL_OMEGA':
                    window.dispatchEvent(new CustomEvent('monolith-nav', { detail: { target: 'matrix' } }));
                    window.dispatchEvent(new CustomEvent('monolith-archive', { detail: { action: 'lock', value: true } }));
                    speak("Protocol Omega engaged. All archives are locked and the matrix is isolated. We are secure, Sir.", true);
                    break;
                case 'BOOST_MORALE':
                    // Handled by AI speech
                    break;
                case 'SUMMARIZE_TASKS':
                    const savedTasks = localStorage.getItem('monolith_v2_tasks');
                    if (savedTasks) {
                        const tasks = JSON.parse(savedTasks);
                        const pending = tasks.filter((t: any) => !t.done);
                        if (pending.length > 0) {
                            const list = pending.map((t: any) => t.text).join(', ');
                            speak(`You have ${pending.length} outstanding objectives, Sir: ${list}. I suggest we prioritize these before the next cycle.`, true);
                        } else {
                            speak("Your objective matrix is currently clear, Sir. A clean slate for your next endeavor.", true);
                        }
                    } else {
                        speak("I have no records of pending objectives in the current matrix, Sir.", true);
                    }
                    break;
            }
        } else if (cmd.length > 3) {
            // Keyword fallback
            if (cmd.includes('hello') || cmd.includes('hi')) {
                speak("At your service, Sir.", true);
            }
        }
    }, [speak]);

    const stopListening = useCallback(() => {
        if (globalRecognition) {
            globalRecognition.onend = null;
            globalRecognition.stop();
            globalRecognition = null;
            window.dispatchEvent(new CustomEvent('monolith-listening', { detail: { active: false } }));
        }
    }, []);

    const startListening = useCallback(() => {
        if (globalRecognition) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 3; // Capture multiple possibilities
        globalRecognition = recognition;

        recognition.onstart = () => {
            window.dispatchEvent(new CustomEvent('monolith-listening', { detail: { active: true } }));
        };

        recognition.onresult = (event: any) => {
            const lastIndex = event.results.length - 1;
            const resultList = event.results[lastIndex];

            // Check all alternatives for better "hearing"
            let bestTranscript = resultList[0].transcript;
            let finalFound = resultList.isFinal;

            // If we're looking for a wake word, see if it's in ANY alternative
            const aliases = ['rain', 'rayne', 'jarvis', 'javis', 'javos', 'jarv', 'jarvies', 'jervis', 'travis'];
            for (let i = 0; i < resultList.length; i++) {
                if (aliases.some(a => resultList[i].transcript.toLowerCase().includes(a))) {
                    bestTranscript = resultList[i].transcript;
                    break;
                }
            }

            // INSTANT INTERRUPT: Only cancel if we hear something substantial
            const isSubstantial = bestTranscript.length > 10 || finalFound;
            if (typeof window !== 'undefined' && window.speechSynthesis.speaking && isSubstantial) {
                window.speechSynthesis.cancel();
            }

            if (finalFound) {
                executeVoiceCommand(bestTranscript);
            } else {
                dispatchSubtitle(bestTranscript, true);
            }
        };

        recognition.onend = () => {
            if (globalRecognition) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Recognition Restart Error", e);
                    globalRecognition = null;
                    window.dispatchEvent(new CustomEvent('monolith-listening', { detail: { active: false } }));
                }
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') {
                stopListening();
            }
        };

        recognition.start();
    }, [executeVoiceCommand, stopListening]);

    return { speak, startListening, stopListening, executeVoiceCommand };
};
