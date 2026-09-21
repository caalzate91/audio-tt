import { LlmAgent } from '@google/adk';
import { pcmToWavUrl } from '../models/audioCodec.js';

/**
 * Agente Orquestador TTS usando @google/adk.
 * Encapsula la dirección de interpretación y síntesis vocal en Gemini TTS.
 */
export const ttsOrchestratorAgent = new LlmAgent({
    name: 'tts-orchestrator',
    model: 'gemini-2.5-flash-preview-tts',
    instruction: `You are an elite Audio & Voice Director specializing in Google Gemini Text-to-Speech synthesis.
Your responsibility is to format speech synthesis prompts, enforce accents, prosody, emotions, and ensure seamless single-shot multi-character audio generation.
You output strictly audio synthesis configurations without reading metadata tags or character names aloud.`
});

/**
 * Helper con reintentos para llamadas TTS a Gemini.
 */
const fetchWithRetry = async (url, options, retries = 3) => {
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[TTS Agent] Intento ${i + 1}/${retries} contactando a Gemini TTS...`);
            const startTime = performance.now();
            const res = await fetch(url, options);
            const duration = Math.round(performance.now() - startTime);

            console.log(`[TTS Agent] Respuesta HTTP recibida en ${duration}ms. Status: ${res.status}`);

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`HTTP ${res.status}: ${errText}`);
            }

            const json = await res.json();
            return json;
        } catch (e) {
            console.warn(`[TTS Agent] Intento ${i + 1} falló:`, e.message);
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
};

/**
 * Síntesis de una sola línea de diálogo (Preescuchar individual).
 */
export const synthesizeSingleBlock = async ({ block, apiKey, modelName = 'gemini-2.5-flash-preview-tts' }) => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error('API Key no configurada.');

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
        model: modelName
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;

    const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData || !inlineData.data) {
        throw new Error('La respuesta de Gemini no devolvió datos de audio.');
    }

    const mimeType = inlineData.mimeType || '';
    const rateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
    const wavInfo = pcmToWavUrl(inlineData.data, sampleRate);

    return {
        audioUrl: wavInfo.url,
        pcmData: wavInfo.bytes,
        sampleRate,
        status: 'success'
    };
};

/**
 * Síntesis de todo el guion en una sola llamada a Gemini (Generación completa).
 */
export const synthesizeFullScript = async ({ blocks, apiKey, modelName = 'gemini-2.5-flash-preview-tts' }) => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error('API Key no configurada.');

    const activeBlocks = blocks.filter(b => b.text && b.text.trim().length > 0);
    if (activeBlocks.length === 0) {
        throw new Error('No hay texto en los bloques para generar audio.');
    }

    const characterProfiles = activeBlocks.map((b, idx) =>
        `- Personaje ${idx + 1} (${b.voice}): Voz y estilo "${b.accent}"`
    ).join('\n');

    const transcriptText = activeBlocks.map(b => `[${b.voice}]: ${b.text}`).join('\n');

    const promptText = `AUDIO PROFILE:
${characterProfiles}

DIRECTOR'S NOTES:
Perform the following dialogue transcript smoothly and continuously as a multi-character scene.
Adopt the appropriate voice persona, accent, emotion, and tone for each character according to the AUDIO PROFILE.
Do not read character labels like [Aoede], brackets, section titles, metadata, or instructions.
Only speak the actual dialogue text naturally.

TRANSCRIPT:
${transcriptText}`;

    const primaryVoice = activeBlocks[0]?.voice || 'Aoede';

    const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: primaryVoice }
                }
            }
        },
        model: modelName
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;

    const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData || !inlineData.data) {
        throw new Error('La respuesta de Gemini no devolvió datos de audio.');
    }

    const mimeType = inlineData.mimeType || '';
    const rateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
    const wavInfo = pcmToWavUrl(inlineData.data, sampleRate);

    return {
        audioUrl: wavInfo.url,
        bytes: wavInfo.bytes,
        sampleRate
    };
};
