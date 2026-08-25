import React, { useState, useRef, useEffect } from 'react';

// Lista de voces disponibles en el modelo
const VOICES = [
    "Aoede", "Zephyr", "Puck", "Charon", "Kore",
    "Fenrir", "Leda", "Orus", "Callirrhoe", "Umbriel"
];

// Presets de acentos en inglés y estilos
const ACCENT_PRESETS = [
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

// Función para manejar reintentos de conexión con la API
const fetchWithRetry = async (url, options, retries = 5) => {
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Error HTTP: ${res.status}, Mensaje: ${errText}`);
            }
            return await res.json();
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
};

// Convierte un Uint8Array de datos PCM a URL WAV reproducible
const pcmToWavUrlFromUint8 = (uint8Array, sampleRate) => {
    const buffer = new ArrayBuffer(44 + uint8Array.length);
    const view = new DataView(buffer);

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // Construcción de la cabecera WAV
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + uint8Array.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Formato (PCM = 1)
    view.setUint16(22, 1, true); // 1 Canal (Mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); // 16 bits por muestra
    writeString(view, 36, 'data');
    view.setUint32(40, uint8Array.length, true);

    // Escribir los datos PCM
    const dataArray = new Uint8Array(buffer, 44);
    dataArray.set(uint8Array);

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
};

// Función para convertir los datos PCM recibidos (Base64) a formato WAV reproducible
const pcmToWavUrl = (base64Data, sampleRate) => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return {
        url: pcmToWavUrlFromUint8(bytes, sampleRate),
        bytes: bytes
    };
};

export default function App() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    // Estados principales
    const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'raw'
    const [blocks, setBlocks] = useState([
        { id: 1, voice: "Aoede", accent: "British English (Received Pronunciation) accent", text: "Hello, welcome to this multi-voice demonstration.", audioUrl: null, pcmData: null, sampleRate: 24000, status: 'idle' },
        { id: 2, voice: "Zephyr", accent: "General American English accent", text: "Hi! It is great to show how multiple accents can sound together.", audioUrl: null, pcmData: null, sampleRate: 24000, status: 'idle' },
        { id: 3, voice: "Kore", accent: "Australian English accent", text: "G'day mate! We can even download the entire merged script.", audioUrl: null, pcmData: null, sampleRate: 24000, status: 'idle' }
    ]);
    const [rawScript, setRawScript] = useState(
        `[Aoede - British English (Received Pronunciation) accent]: Hello, welcome to this multi-voice demonstration.\n` +
        `[Zephyr - General American English accent]: Hi! It is great to show how multiple accents can sound together.\n` +
        `[Kore - Australian English accent]: G'day mate! We can even download the entire merged script.`
    );
    
    const [globalLoading, setGlobalLoading] = useState(false);
    const [mergedAudioUrl, setMergedAudioUrl] = useState(null);
    const [error, setError] = useState('');
    const mergedAudioRef = useRef(null);

    // Sincronizar cambios en bloques hacia el script raw
    const syncBlocksToRawScript = (currentBlocks) => {
        const text = currentBlocks.map(b => `[${b.voice} - ${b.accent}]: ${b.text}`).join('\n');
        setRawScript(text);
    };

    // Agregar un nuevo bloque de diálogo
    const addBlock = () => {
        const newId = Date.now();
        const newBlocks = [...blocks, {
            id: newId,
            voice: VOICES[0],
            accent: "Standard English accent",
            text: "",
            audioUrl: null,
            pcmData: null,
            sampleRate: 24000,
            status: 'idle'
        }];
        setBlocks(newBlocks);
        syncBlocksToRawScript(newBlocks);
    };

    // Eliminar bloque de diálogo
    const removeBlock = (id) => {
        if (blocks.length <= 1) {
            setError("Debes mantener al menos un bloque de diálogo.");
            return;
        }
        const newBlocks = blocks.filter(b => b.id !== id);
        setBlocks(newBlocks);
        syncBlocksToRawScript(newBlocks);
        setMergedAudioUrl(null);
    };

    // Actualizar campos de un bloque
    const updateBlock = (id, field, value) => {
        const newBlocks = blocks.map(b => {
            if (b.id === id) {
                return { ...b, [field]: value, audioUrl: null, pcmData: null, status: 'idle' };
            }
            return b;
        });
        setBlocks(newBlocks);
        syncBlocksToRawScript(newBlocks);
        setMergedAudioUrl(null);
    };

    // Reordenar bloques (Mover Arriba/Abajo)
    const moveBlock = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;

        const newBlocks = [...blocks];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[swapIndex];
        newBlocks[swapIndex] = temp;

        setBlocks(newBlocks);
        syncBlocksToRawScript(newBlocks);
        setMergedAudioUrl(null);
    };

    // Parser de Script Raw
    const handleParseRawScript = () => {
        const lines = rawScript.split('\n');
        const parsed = [];
        let currentId = Date.now();

        for (const line of lines) {
            if (!line.trim()) continue;

            // Busca patrón: [Voice - Accent]: Texto o [Voice]: Texto
            const bracketMatch = line.match(/^\s*\[\s*([A-Za-z0-9]+)(?:\s*[-|]\s*([^\]]+))?\]\s*:\s*(.+)$/i);
            if (bracketMatch) {
                const voiceName = bracketMatch[1].trim();
                const accent = bracketMatch[2] ? bracketMatch[2].trim() : 'Standard English accent';
                const text = bracketMatch[3].trim();
                const matchedVoice = VOICES.find(v => v.toLowerCase() === voiceName.toLowerCase()) || VOICES[0];

                parsed.push({
                    id: ++currentId,
                    voice: matchedVoice,
                    accent: accent,
                    text: text,
                    audioUrl: null,
                    pcmData: null,
                    sampleRate: 24000,
                    status: 'idle'
                });
                continue;
            }

            // Busca patrón: Voice (Accent): Texto
            const parenMatch = line.match(/^\s*([A-Za-z0-9]+)\s*\(([^)]+)\)\s*:\s*(.+)$/i);
            if (parenMatch) {
                const voiceName = parenMatch[1].trim();
                const accent = parenMatch[2].trim();
                const text = parenMatch[3].trim();
                const matchedVoice = VOICES.find(v => v.toLowerCase() === voiceName.toLowerCase()) || VOICES[0];

                parsed.push({
                    id: ++currentId,
                    voice: matchedVoice,
                    accent: accent,
                    text: text,
                    audioUrl: null,
                    pcmData: null,
                    sampleRate: 24000,
                    status: 'idle'
                });
                continue;
            }

            // Busca patrón: Voice: Texto
            const simpleMatch = line.match(/^\s*([A-Za-z0-9]+)\s*:\s*(.+)$/i);
            if (simpleMatch) {
                const voiceName = simpleMatch[1].trim();
                const text = simpleMatch[2].trim();
                const matchedVoice = VOICES.find(v => v.toLowerCase() === voiceName.toLowerCase());

                if (matchedVoice) {
                    parsed.push({
                        id: ++currentId,
                        voice: matchedVoice,
                        accent: 'Standard English accent',
                        text: text,
                        audioUrl: null,
                        pcmData: null,
                        sampleRate: 24000,
                        status: 'idle'
                    });
                    continue;
                }
            }

            // Fallback
            parsed.push({
                id: ++currentId,
                voice: VOICES[0],
                accent: 'Standard English accent',
                text: line.trim(),
                audioUrl: null,
                pcmData: null,
                sampleRate: 24000,
                status: 'idle'
            });
        }

        if (parsed.length > 0) {
            setBlocks(parsed);
            setActiveTab('blocks');
            setError('');
            setMergedAudioUrl(null);
        } else {
            setError("No se encontraron líneas válidas para importar. Usa el formato [Voz - Acento]: Texto");
        }
    };

    // Generar audio para un solo bloque
    const generateSingleBlock = async (id) => {
        if (!apiKey.trim()) {
            setError("API Key no configurada. Edita el archivo .env.");
            return;
        }

        const block = blocks.find(b => b.id === id);
        if (!block || !block.text.trim()) return;

        // Actualizar estado del bloque a cargando
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, status: 'generating' } : b));
        setError('');

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey.trim()}`;
            const promptText = `AUDIO PROFILE:
Voice persona: ${block.voice}
Accent and style: ${block.accent}

DIRECTOR'S NOTES:
Read the transcript below. Speak naturally, clearly, and with the exact accent and style requested.
Do not read any section headers, metadata, or instructions. Only speak the text in the TRANSCRIPT section.

TRANSCRIPT:
${block.text}`;

            const payload = {
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: block.voice }
                        }
                    }
                },
                model: "gemini-2.5-flash-preview-tts"
            };

            const data = await fetchWithRetry(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (!inlineData) {
                throw new Error("Respuesta sin datos de audio.");
            }

            const mimeType = inlineData.mimeType || '';
            const rateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

            const base64Data = inlineData.data;
            const wavInfo = pcmToWavUrl(base64Data, sampleRate);

            setBlocks(prev => prev.map(b => b.id === id ? {
                ...b,
                audioUrl: wavInfo.url,
                pcmData: wavInfo.bytes,
                sampleRate: sampleRate,
                status: 'success'
            } : b));

        } catch (err) {
            console.error(err);
            setBlocks(prev => prev.map(b => b.id === id ? { ...b, status: 'error' } : b));
            setError(`Error al generar bloque: ${err.message}`);
        }
    };

    // Generar todos los bloques y unirlos
    const handleGenerateAllAndMerge = async () => {
        if (!apiKey.trim()) {
            setError("API Key no configurada. Configúrala en el archivo .env.");
            return;
        }

        setGlobalLoading(true);
        setError('');
        setMergedAudioUrl(null);

        try {
            // Generar todos los bloques en paralelo/secuencial que no estén generados aún o todos
            const updatedBlocks = [...blocks];

            for (let i = 0; i < updatedBlocks.length; i++) {
                const block = updatedBlocks[i];
                if (!block.text.trim()) continue;

                // Solo generar si no se ha generado previamente o está en estado de error
                if (!block.pcmData || block.status === 'error' || block.status === 'idle') {
                    // Actualizar estado visual
                    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, status: 'generating' } : b));

                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey.trim()}`;
                    const promptText = `AUDIO PROFILE:
Voice persona: ${block.voice}
Accent and style: ${block.accent}

DIRECTOR'S NOTES:
Read the transcript below. Speak naturally, clearly, and with the exact accent and style requested.
Do not read any section headers, metadata, or instructions. Only speak the text in the TRANSCRIPT section.

TRANSCRIPT:
${block.text}`;

                    const payload = {
                        contents: [{ parts: [{ text: promptText }] }],
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: block.voice }
                                }
                            }
                        },
                        model: "gemini-2.5-flash-preview-tts"
                    };

                    const data = await fetchWithRetry(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
                    if (!inlineData) {
                        throw new Error(`Fallo en el bloque ${i + 1}`);
                    }

                    const mimeType = inlineData.mimeType || '';
                    const rateMatch = mimeType.match(/rate=(\d+)/);
                    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

                    const wavInfo = pcmToWavUrl(inlineData.data, sampleRate);
                    
                    block.audioUrl = wavInfo.url;
                    block.pcmData = wavInfo.bytes;
                    block.sampleRate = sampleRate;
                    block.status = 'success';

                    // Actualizar estado en tiempo real
                    setBlocks(prev => prev.map(b => b.id === block.id ? {
                        ...b,
                        audioUrl: wavInfo.url,
                        pcmData: wavInfo.bytes,
                        sampleRate: sampleRate,
                        status: 'success'
                    } : b));
                }
            }

            // Concatenar todos los PCM
            const activeBlocks = updatedBlocks.filter(b => b.pcmData && b.pcmData.length > 0);
            if (activeBlocks.length === 0) {
                throw new Error("No hay bloques de audio generados para combinar.");
            }

            const totalLength = activeBlocks.reduce((acc, b) => acc + b.pcmData.length, 0);
            const mergedPCM = new Uint8Array(totalLength);
            let offset = 0;

            for (const b of activeBlocks) {
                mergedPCM.set(b.pcmData, offset);
                offset += b.pcmData.length;
            }

            const baseSampleRate = activeBlocks[0].sampleRate || 24000;
            const mergedWav = pcmToWavUrlFromUint8(mergedPCM, baseSampleRate);
            setMergedAudioUrl(mergedWav);

        } catch (err) {
            console.error(err);
            setError(`Error al combinar audios: ${err.message}`);
        } finally {
            setGlobalLoading(false);
        }
    };

    // Descargar un archivo de audio específico
    const triggerDownload = (url, name) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Descargar todas las pistas individuales
    const downloadAllTracks = () => {
        blocks.forEach((block, idx) => {
            if (block.audioUrl) {
                setTimeout(() => {
                    triggerDownload(block.audioUrl, `pista_${idx + 1}_${block.voice}_${block.accent.split(' ')[0]}.wav`);
                }, idx * 400); // Pequeño delay para no saturar las descargas del navegador
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white relative">
                    <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider animate-pulse">
                        Multi-Voice Ready
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3 tracking-tight">
                        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                        </svg>
                        Studio Audio Script (TTS)
                    </h1>
                    <p className="mt-2 text-violet-100 opacity-90 text-sm sm:text-base max-w-2xl">
                        Crea diálogos con más de 2 voces distintas simultáneamente. Modela acentos en inglés, tonos y emociones usando la tecnología de IA y expórtalo todo como un archivo de audio unificado.
                    </p>
                </div>

                {/* Tabs / Switcher */}
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('blocks')}
                        className={`flex-1 py-4 text-center font-bold transition-all text-sm sm:text-base border-b-2 flex items-center justify-center gap-2 ${
                            activeTab === 'blocks'
                                ? 'border-violet-500 text-violet-400 bg-slate-800'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                        Editor de Bloques
                    </button>
                    <button
                        onClick={() => setActiveTab('raw')}
                        className={`flex-1 py-4 text-center font-bold transition-all text-sm sm:text-base border-b-2 flex items-center justify-center gap-2 ${
                            activeTab === 'raw'
                                ? 'border-violet-500 text-violet-400 bg-slate-800'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Script Raw (Parser)
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="p-6 sm:p-8 flex flex-col gap-6">

                    {error && (
                        <div className="p-4 bg-red-500/20 text-red-200 rounded-2xl border border-red-500/40 flex items-start gap-3">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Tab 1: Block Editor */}
                    {activeTab === 'blocks' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-300">Líneas de Diálogo</h3>
                                <button
                                    onClick={addBlock}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                    </svg>
                                    Agregar Línea
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
                                {blocks.map((block, index) => (
                                    <div
                                        key={block.id}
                                        className="bg-slate-700/40 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 relative transition-all duration-300 hover:border-slate-600"
                                    >
                                        {/* Block Top Controls */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-800 text-slate-400 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                
                                                {/* Voice Dropdown */}
                                                <select
                                                    value={block.voice}
                                                    onChange={(e) => updateBlock(block.id, 'voice', e.target.value)}
                                                    className="bg-slate-800 text-slate-100 text-sm font-semibold rounded-lg px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-violet-500"
                                                >
                                                    {VOICES.map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                                
                                                {/* Accent Input & Presets combo */}
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        value={block.accent}
                                                        onChange={(e) => updateBlock(block.id, 'accent', e.target.value)}
                                                        placeholder="Acento o tono..."
                                                        className="bg-slate-800 text-slate-100 text-xs rounded-lg px-2 py-1.5 border border-slate-600 max-w-[150px] sm:max-w-xs focus:outline-none focus:border-violet-500"
                                                    />
                                                    <select
                                                        onChange={(e) => updateBlock(block.id, 'accent', e.target.value)}
                                                        value=""
                                                        className="bg-slate-800 text-slate-400 text-xs rounded-lg p-1.5 border border-slate-600 focus:outline-none"
                                                    >
                                                        <option value="" disabled>Presets...</option>
                                                        {ACCENT_PRESETS.map(p => (
                                                            <option key={p.value} value={p.value}>{p.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Block actions */}
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => moveBlock(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all"
                                                    title="Mover arriba"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => moveBlock(index, 'down')}
                                                    disabled={index === blocks.length - 1}
                                                    className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all"
                                                    title="Mover abajo"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => removeBlock(block.id)}
                                                    className="p-1 text-red-400 hover:text-red-300 transition-all ml-2"
                                                    title="Eliminar línea"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Block Dialogue Input */}
                                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                                            <textarea
                                                rows="2"
                                                value={block.text}
                                                onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                                                placeholder="Introduce el guion de este personaje..."
                                                className="w-full bg-slate-800 text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-violet-500 resize-none text-sm"
                                            />

                                            {/* Preview and mini player */}
                                            <div className="flex flex-col gap-2 items-center justify-end w-full sm:w-auto min-w-[150px]">
                                                {block.audioUrl ? (
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <audio src={block.audioUrl} controls className="w-40 h-8 scale-90" />
                                                        <button
                                                            onClick={() => triggerDownload(block.audioUrl, `dialogo_${index + 1}.wav`)}
                                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                                                        >
                                                            Descargar WAV
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => generateSingleBlock(block.id)}
                                                        disabled={block.status === 'generating'}
                                                        className={`w-full text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                                            block.status === 'generating'
                                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                                                        }`}
                                                    >
                                                        {block.status === 'generating' ? (
                                                            <>
                                                                <svg className="animate-spin h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                </svg>
                                                                Generando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                                                </svg>
                                                                Preescuchar
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Raw Script Parser */}
                    {activeTab === 'raw' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-300">Pega tu Guion en Formato Script</h3>
                                <button
                                    onClick={handleParseRawScript}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all active:scale-95 shadow-md"
                                >
                                    Importar e ir a Bloques
                                </button>
                            </div>

                            <textarea
                                value={rawScript}
                                onChange={(e) => setRawScript(e.target.value)}
                                rows="10"
                                placeholder={`Usa uno de los siguientes formatos:\n[Aoede - British English]: Hola amigo.\nZephyr (American English): Hello standard voice.\nKore: Dialogue without explicit accent.`}
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-slate-100 font-mono text-sm focus:outline-none focus:border-violet-500"
                            />
                            
                            <div className="bg-slate-700/20 border border-slate-700/60 p-4 rounded-xl text-xs text-slate-400 flex flex-col gap-2">
                                <p className="font-semibold text-slate-300">Instrucciones de formato:</p>
                                <ul className="list-disc pl-5 flex flex-col gap-1">
                                    <li>Formatos soportados: <code className="text-indigo-300">[Voz - Acento]: Texto</code> o <code className="text-indigo-300">Voz (Acento): Texto</code> o <code className="text-indigo-300">Voz: Texto</code></li>
                                    <li>Las voces válidas son: {VOICES.join(', ')}.</li>
                                    <li>Los acentos pueden ser descripciones de texto naturales libres (por ejemplo: "Australian English accent", "London Cockney accent", "excited tone").</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* General Actions & Merged audio player */}
                    <div className="border-t border-slate-700/60 pt-6 mt-2 flex flex-col gap-6">
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleGenerateAllAndMerge}
                                disabled={globalLoading}
                                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                                    globalLoading
                                        ? 'bg-violet-800/50 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-550 hover:shadow-violet-900/30'
                                }`}
                            >
                                {globalLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Procesando script de diálogo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                        </svg>
                                        Generar & Combinar Audio
                                    </>
                                )}
                            </button>

                            {blocks.some(b => b.audioUrl) && (
                                <button
                                    onClick={downloadAllTracks}
                                    className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 py-4 px-6 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    Descargar Pistas Individuales
                                </button>
                            )}
                        </div>

                        {/* Merged Player */}
                        {mergedAudioUrl && (
                            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 p-6 rounded-3xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                <h3 className="font-bold text-indigo-400 flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                    ¡Audio Completo Combinado con Éxito!
                                </h3>
                                
                                <audio
                                    ref={mergedAudioRef}
                                    controls
                                    src={mergedAudioUrl}
                                    className="w-full max-w-lg shadow-2xl rounded-full bg-slate-900 border border-slate-700"
                                    autoPlay
                                >
                                    Tu navegador no soporta el reproductor de audio.
                                </audio>

                                <button
                                    onClick={() => triggerDownload(mergedAudioUrl, "dialogo_completo.wav")}
                                    className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-2 mt-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    Exportar Audio WAV Completo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}