import React, { useState, useRef } from 'react';

// Lista de voces disponibles en el modelo
const VOICES = [
    "Aoede", "Zephyr", "Puck", "Charon", "Kore",
    "Fenrir", "Leda", "Orus", "Callirrhoe", "Umbriel"
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

// Función para convertir los datos PCM recibidos (Base64) a formato WAV reproducible
const pcmToWavUrl = (base64Data, sampleRate) => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const buffer = new ArrayBuffer(44 + bytes.length);
    const view = new DataView(buffer);

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // Construcción de la cabecera WAV
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bytes.length, true);
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
    view.setUint32(40, bytes.length, true);

    // Escribir los datos PCM
    const dataArray = new Uint8Array(buffer, 44);
    dataArray.set(bytes);

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
};

export default function App() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const [script, setScript] = useState('');
    const [voice, setVoice] = useState(VOICES[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState('');
    const audioRef = useRef(null);

    const handleGenerate = async () => {
        if (!apiKey.trim()) {
            setError("No se encontró la API Key de Gemini. Por favor configúrala en el archivo .env (VITE_GEMINI_API_KEY).");
            return;
        }

        if (!script.trim()) {
            setError("Por favor, ingresa un guion para generar el audio.");
            return;
        }

        setIsLoading(true);
        setError('');
        setAudioUrl(null);

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey.trim()}`;

            const payload = {
                contents: [{ parts: [{ text: script }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voice }
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
                throw new Error("No se recibió información de audio en la respuesta. Es posible que el contenido haya sido bloqueado o haya ocurrido un error.");
            }

            // Extraer la tasa de muestreo (sample rate) de la cabecera mimeType. Default: 24000
            const mimeType = inlineData.mimeType || '';
            const rateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

            const base64Data = inlineData.data;
            const wavUrl = pcmToWavUrl(base64Data, sampleRate);
            setAudioUrl(wavUrl);

        } catch (err) {
            console.error("Error generando audio:", err);
            setError("Hubo un error al generar el audio. Verifica tu conexión o intenta con un texto diferente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">

                {/* Cabecera */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 text-white">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                        </svg>
                        Generador de Audio (TTS)
                    </h1>
                    <p className="mt-2 text-blue-100 opacity-90 text-sm sm:text-base">
                        Pega tu guion de texto abajo, selecciona una voz y transforma el contenido en un archivo de audio natural en cuestión de segundos.
                    </p>
                </div>

                {/* Contenido principal */}
                <div className="p-6 sm:p-8 flex flex-col gap-6">

                    {/* Área de texto */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="script" className="font-semibold text-slate-700">Guion a convertir</label>
                        <textarea
                            id="script"
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="Escribe o pega aquí el texto que deseas que sea narrado..."
                            className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y transition-all text-slate-700 bg-slate-50"
                        />
                        <div className="text-right text-xs text-slate-400">
                            {script.length} caracteres
                        </div>
                    </div>

                    {/* Controles: Voz y Botón Generar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:w-1/2 flex flex-col gap-2">
                            <label htmlFor="voice" className="font-semibold text-slate-700">Selecciona la voz</label>
                            <div className="relative">
                                <select
                                    id="voice"
                                    value={voice}
                                    onChange={(e) => setVoice(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-xl appearance-none bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-700"
                                >
                                    {VOICES.map((v) => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className={`w-full sm:w-1/2 flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-white transition-all transform active:scale-95 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generando Audio...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Generar Audio
                                </>
                            )}
                        </button>
                    </div>

                    {/* Mensaje de Error */}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-3">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Reproductor de Audio (Aparece cuando hay audio listo) */}
                    {audioUrl && (
                        <div className="mt-4 p-6 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm12-3c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zM9 10l12-3"></path>
                                </svg>
                                ¡Audio generado con éxito!
                            </h3>
                            <audio
                                ref={audioRef}
                                controls
                                src={audioUrl}
                                className="w-full max-w-md shadow-sm rounded-full"
                                autoPlay
                            >
                                Tu navegador no soporta el elemento de audio.
                            </audio>
                            <a
                                href={audioUrl}
                                download="script_narrado.wav"
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                Descargar archivo WAV
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}