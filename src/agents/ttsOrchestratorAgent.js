import { LlmAgent, Gemini, InMemoryRunner } from '@google/adk';
import { processAudioDataToWav } from '../models/audioCodec.js';

const TTS_DIRECTOR_INSTRUCTION = `You are an elite Audio & Voice Director specializing in Google Gemini Text-to-Speech synthesis.
Your responsibility is to format speech synthesis prompts, enforce accents, prosody, emotions, and ensure seamless audio generation.
You output strictly audio synthesis configurations without reading metadata tags or character names aloud.`;

/**
 * Agente Orquestador TTS usando @google/adk.
 */
export const ttsOrchestratorAgent = new LlmAgent({
    name: 'tts-orchestrator',
    model: 'gemini-2.5-flash-preview-tts',
    instruction: TTS_DIRECTOR_INSTRUCTION
});

/**
 * Helper para extraer datos de audio de los eventos generados por InMemoryRunner o respuesta de ADK.
 */
const extractAudioFromEventsOrResponse = (eventsOrResponse) => {
    let rawAudioData = null;
    let mimeType = '';
    let errorMessage = '';

    const checkPart = (part) => {
        if (!part) return;
        const inline = part.inlineData || part.inline_data || part.blob;
        if (inline?.data) {
            rawAudioData = inline.data;
            mimeType = inline.mimeType || inline.mime_type || '';
        } else if (part.data) {
            rawAudioData = part.data;
            mimeType = part.mimeType || part.mime_type || '';
        }
    };

    if (Array.isArray(eventsOrResponse)) {
        for (const event of eventsOrResponse) {
            if (event.errorMessage) {
                errorMessage = event.errorMessage;
            }
            if (event.content?.parts) {
                for (const part of event.content.parts) {
                    checkPart(part);
                }
            }
        }
    } else if (eventsOrResponse?.candidates?.[0]?.content?.parts) {
        for (const part of eventsOrResponse.candidates[0].content.parts) {
            checkPart(part);
        }
    }

    if (!rawAudioData) {
        if (errorMessage) {
            throw new Error(`Error en el modelo ADK: ${errorMessage}`);
        }
        throw new Error('El Agente TTS de @google/adk no devolvió datos de audio en la respuesta.');
    }

    const rateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
    const wavInfo = processAudioDataToWav(rawAudioData, sampleRate, mimeType);

    return {
        url: wavInfo.url,
        bytes: wavInfo.bytes,
        sampleRate
    };
};

/**
 * Ejecuta la síntesis de audio a través de los componentes nativos de @google/adk.
 */
const executeAdkTts = async ({ promptText, voiceName, modelName, apiKey }) => {
    // 1. Instanciar el modelo Gemini desde el SDK de @google/adk
    const model = new Gemini({
        model: modelName || 'gemini-2.5-flash-preview-tts',
        apiKey
    });

    const generateConfig = {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName }
            }
        }
    };

    // 2. Instanciar el Agente ADK con el modelo y la configuración de voz
    const agent = new LlmAgent({
        name: `tts-${voiceName.toLowerCase()}`,
        model,
        instruction: TTS_DIRECTOR_INSTRUCTION,
        generateContentConfig: generateConfig
    });

    try {
        // Intentar primero con InMemoryRunner del ADK
        const runner = new InMemoryRunner({ agent });
        const eventsIterator = runner.runEphemeral({
            userId: 'tts-runner-user',
            newMessage: {
                parts: [{ text: promptText }]
            }
        });

        const collectedEvents = [];
        for await (const event of eventsIterator) {
            collectedEvents.push(event);
        }

        return extractAudioFromEventsOrResponse(collectedEvents);
    } catch (runnerErr) {
        console.warn('[ADK Runner]: Intentando generación directa con model.apiClient de ADK...', runnerErr.message);

        // Fallback usando el cliente de modelos de @google/genai encapsulado en la instancia Gemini de ADK
        const response = await model.apiClient.models.generateContent({
            model: model.model,
            contents: [{ parts: [{ text: promptText }] }],
            config: generateConfig
        });

        return extractAudioFromEventsOrResponse(response);
    }
};

/**
 * Síntesis de una sola línea de diálogo (Preescuchar individual) usando @google/adk.
 */
export const synthesizeSingleBlock = async ({ block, apiKey, modelName = 'gemini-2.5-flash-preview-tts' }) => {
    const cleanKey = apiKey?.trim();
    if (!cleanKey) throw new Error('API Key no configurada.');

    const promptText = `AUDIO PROFILE:
Voice persona: ${block.voice}
Accent and style: ${block.accent}

DIRECTOR'S NOTES:
Read the transcript below. Speak naturally, clearly, and with the exact accent and style requested.
Do not read any section headers, metadata, or instructions. Only speak the text in the TRANSCRIPT section.

TRANSCRIPT:
${block.text}`;

    const wavInfo = await executeAdkTts({
        promptText,
        voiceName: block.voice,
        modelName,
        apiKey: cleanKey
    });

    return {
        audioUrl: wavInfo.url,
        pcmData: wavInfo.bytes,
        sampleRate: wavInfo.sampleRate,
        status: 'success'
    };
};

/**
 * Síntesis de todo el guion en una sola llamada usando @google/adk (Generación completa).
 */
export const synthesizeFullScript = async ({ blocks, apiKey, modelName = 'gemini-2.5-flash-preview-tts' }) => {
    const cleanKey = apiKey?.trim();
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

    const wavInfo = await executeAdkTts({
        promptText,
        voiceName: primaryVoice,
        modelName,
        apiKey: cleanKey
    });

    return {
        audioUrl: wavInfo.url,
        bytes: wavInfo.bytes,
        sampleRate: wavInfo.sampleRate
    };
};
