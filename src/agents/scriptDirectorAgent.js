import { LlmAgent, GOOGLE_SEARCH } from '@google/adk';
import { VOICES } from '../models/dialogueModel.js';

/**
 * Agente Director de Guiones usando @google/adk.
 * Permite investigar temas con GOOGLE_SEARCH y generar guiones listos para TTS.
 */
export const scriptDirectorAgent = new LlmAgent({
    name: 'script-director',
    model: 'gemini-2.5-flash',
    instruction: `You are an expert scriptwriter, dialogue director, and researcher.
Your task is to write dynamic, natural, multi-voice dialogue scripts based on user topics or research queries.
You must select voices exclusively from the available voice list: ${VOICES.join(', ')}.
Assign fitting accents/styles from common English variations (e.g., 'British English (Received Pronunciation) accent', 'General American English accent', 'Australian English accent', 'Excited, enthusiastic, and joyful tone', 'Whispering voice, soft spoken').

Format each line of dialogue strictly in the following format:
[VoiceName - Accent Description]: Dialogue text

Example:
[Aoede - British English (Received Pronunciation) accent]: Welcome to today's deep dive.
[Zephyr - General American English accent]: Thanks for having me, excited to discuss this topic!

Provide only the formatted dialogue lines, without markdown conversational intro or outro text.`,
    tools: [GOOGLE_SEARCH]
});

/**
 * Ejecuta el agente director con la API Key configurada.
 */
export const runScriptDirector = async ({ topic, apiKey, modelName = 'gemini-2.5-flash' }) => {
    if (!apiKey) {
        throw new Error('API Key requerida para ejecutar el Agente Director.');
    }

    // Llamada directa usando la API de Gemini para entornos browser con compatibilidad ADK
    const systemInstruction = scriptDirectorAgent.instruction;
    const prompt = `Topic to write a dialogue about: ${topic}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-2.5-flash'}:generateContent?key=${apiKey.trim()}`;

    const payload = {
        contents: [
            {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nTask: ${prompt}` }]
            }
        ],
        generationConfig: {
            temperature: 0.7
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error en Agente Director (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return generatedText.trim();
};
