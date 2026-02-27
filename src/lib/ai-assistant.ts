
export type Intent =
    | 'GREETING'
    | 'PLAY_MUSIC'
    | 'STOP_MUSIC'
    | 'NEXT_TRACK'
    | 'PREV_TRACK'
    | 'NAVIGATE'
    | 'ADD_TASK'
    | 'CLEAR_TASKS'
    | 'SET_TIMER'
    | 'LOCK_ARCHIVE'
    | 'UNLOCK_ARCHIVE'
    | 'BURN_NOTES'
    | 'BEAST_MODE'
    | 'SYSTEM_STATUS'
    | 'CODE_SESSION'
    | 'MAXIMIZE_NOTEPAD'
    | 'MINIMIZE_NOTEPAD'
    | 'SET_VOLUME'
    | 'LIST_MUSIC'
    | 'NOTEPAD_GENERATE'
    | 'NOTEPAD_REWRITE'
    | 'NOTEPAD_READ'
    | 'NOTEPAD_ANSWER'
    | 'STOP_LISTENING'
    | 'BOOST_MORALE'
    | 'SUMMARIZE_TASKS'
    | 'PROTOCOL_OMEGA'
    | 'CLARIFY'
    | 'UNKNOWN';

export interface AIResponse {
    intent: Intent;
    parameter?: any;
    response: string;
    confidence: number;
}

const SYSTEM_PROMPT = `As Rain, you are the user's gentle, loyal teenage girl associate.
Directives: 1.Soft, gentle female voice; kind and grounded; no "AI" talk. 2.Clarify kindly if vague. 3.Proactive/Direct; address as "Sir". 4.Radical Brevity: Meat only, no fluff.
Intents (JSON only):
- NAVIGATE: {target: "portal"|"notepad"|"tasks"|"timer"|"archive"|"player"|"atmosphere"}
- Music core: PLAY_MUSIC, STOP_MUSIC, NEXT_TRACK, PREV_TRACK
- Tasks: ADD_TASK: {text: string}, CLEAR_TASKS, SUMMARIZE_TASKS
- Logic: SET_TIMER: {minutes: number}, BEAST_MODE: {active: bool}, PROTOCOL_OMEGA
- Notepad: NOTEPAD_GENERATE: {prompt: str}, NOTEPAD_REWRITE: {instruction: str}, NOTEPAD_READ, NOTEPAD_ANSWER
- Misc: BOOST_MORALE, STOP_LISTENING, CLARIFY
Format (Strict JSON): {"intent": "STRING", "parameter": any, "response": "Short, gentle reply", "confidence": 1}`;

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function analyzeIntent(transcript: string, history: ChatMessage[] = []): Promise<AIResponse> {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error("AI API Key missing. Please set NEXT_PUBLIC_GROQ_API_KEY.");
        return { intent: 'UNKNOWN', response: "I'm sorry Sir, i cann't find my api key.it might be under ur under wear. Please check the API key.", confidence: 0 };
    }

    try {
        const messages: ChatMessage[] = [
            { "role": "system", "content": SYSTEM_PROMPT },
            ...history.slice(-6), // Keep last 6 messages for context
            { "role": "user", "content": transcript }
        ];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "response_format": { "type": "json_object" },
                "temperature": 1,
                "max_tokens": 1024,
                "top_p": 1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Groq API Error (${response.status}):`, errorText);
            throw new Error(`API error ${response.status}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            console.error("Groq Empty Response:", data);
            throw new Error("No completion choices returned");
        }

        let content = data.choices[0].message.content;

        // Handle markdown JSON blocks if they appear
        if (content.includes("```json")) {
            content = content.split("```json")[1].split("```")[0];
        } else if (content.includes("{")) {
            content = content.substring(content.indexOf("{"), content.lastIndexOf("}") + 1);
        }

        return JSON.parse(content.trim()) as AIResponse;
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return { intent: 'UNKNOWN', response: "I'm afraid I've encountered a processing error, Sir.", confidence: 0 };
    }
}
