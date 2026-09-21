// Modelo de datos para las voces y presets de diálogos

export const VOICES = [
    "Aoede", "Zephyr", "Puck", "Charon", "Kore",
    "Fenrir", "Leda", "Orus", "Callirrhoe", "Umbriel"
];

export const ACCENT_PRESETS = [
    { label: "Standard English", value: "Standard English accent" },
    { label: "British RP (Received Pronunciation)", value: "British English (Received Pronunciation) accent" },
    { label: "British (London/Cockney)", value: "British London Cockney accent" },
    { label: "American (Standard/General)", value: "General American English accent" },
    { label: "American (Southern Accent)", value: "US Southern accent" },
    { label: "Australian English", value: "Australian English accent" },
    { label: "Irish English", value: "Irish English accent" },
    { label: "Scottish English", value: "Scottish English accent" },
    { label: "Indian English", value: "Indian English accent" },
    { label: "Canadian English", value: "Canadian English accent" },
    { label: "Whispering Tone", value: "Whispering voice, soft spoken" },
    { label: "Excited & Joyful", value: "Excited, enthusiastic, and joyful tone" }
];

export const createDefaultBlock = (id = Date.now(), voice = VOICES[0], accent = "Standard English accent", text = "") => ({
    id,
    voice,
    accent,
    text,
    audioUrl: null,
    pcmData: null,
    sampleRate: 24000,
    status: 'idle'
});

export const initialBlocks = [
    { id: 1, voice: "Aoede", accent: "British English (Received Pronunciation) accent", text: "Hello, welcome to this multi-voice demonstration.", audioUrl: null, pcmData: null, sampleRate: 24000, status: 'idle' },
    { id: 2, voice: "Zephyr", accent: "General American English accent", text: "Hi! It is great to show how multiple accents can sound together.", audioUrl: null, pcmData: null, sampleRate: 24000, status: 'idle' },
    { id: 3, voice: "Kore", accent: "Australian English accent", text: "G'day mate! We can even download the entire merged script.", audioUrl: null, pcmData: null, sampleRate: 24000, status: 'idle' }
];

export const blocksToRawScript = (blocks) => {
    return blocks.map(b => `[${b.voice} - ${b.accent}]: ${b.text}`).join('\n');
};

export const parseRawScriptToBlocks = (rawScript) => {
    const lines = rawScript.split('\n');
    const parsed = [];
    let currentId = Date.now();

    for (const line of lines) {
        if (!line.trim()) continue;

        // Formato [Voice - Accent]: Texto o [Voice]: Texto
        const bracketMatch = line.match(/^\s*\[\s*([A-Za-z0-9]+)(?:\s*[-|]\s*([^\]]+))?\]\s*:\s*(.+)$/i);
        if (bracketMatch) {
            const voiceName = bracketMatch[1].trim();
            const accent = bracketMatch[2] ? bracketMatch[2].trim() : 'Standard English accent';
            const text = bracketMatch[3].trim();
            const matchedVoice = VOICES.find(v => v.toLowerCase() === voiceName.toLowerCase()) || VOICES[0];

            parsed.push(createDefaultBlock(++currentId, matchedVoice, accent, text));
            continue;
        }

        // Formato Voice (Accent): Texto
        const parenMatch = line.match(/^\s*([A-Za-z0-9]+)\s*\(([^)]+)\)\s*:\s*(.+)$/i);
        if (parenMatch) {
            const voiceName = parenMatch[1].trim();
            const accent = parenMatch[2].trim();
            const text = parenMatch[3].trim();
            const matchedVoice = VOICES.find(v => v.toLowerCase() === voiceName.toLowerCase()) || VOICES[0];

            parsed.push(createDefaultBlock(++currentId, matchedVoice, accent, text));
            continue;
        }

        // Formato Voice: Texto
        const simpleMatch = line.match(/^\s*([A-Za-z0-9]+)\s*:\s*(.+)$/i);
        if (simpleMatch) {
            const voiceName = simpleMatch[1].trim();
            const text = simpleMatch[2].trim();
            const matchedVoice = VOICES.find(v => v.toLowerCase() === voiceName.toLowerCase());

            if (matchedVoice) {
                parsed.push(createDefaultBlock(++currentId, matchedVoice, 'Standard English accent', text));
                continue;
            }
        }

        // Fallback genérico
        parsed.push(createDefaultBlock(++currentId, VOICES[0], 'Standard English accent', line.trim()));
    }

    return parsed;
};
