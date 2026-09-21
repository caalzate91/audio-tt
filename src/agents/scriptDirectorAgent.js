import { LlmAgent, GOOGLE_SEARCH, Gemini, InMemoryRunner, stringifyContent } from '@google/adk';
import { VOICES } from '../models/dialogueModel.js';

const SCRIPT_DIRECTOR_INSTRUCTION = `You are an expert scriptwriter, dialogue director, and researcher.
Your task is to write dynamic, natural, multi-voice dialogue scripts based on user topics or research queries.
You must select voices exclusively from the available voice list: ${VOICES.join(', ')}.
Assign fitting accents/styles from common English variations (e.g., 'British English (Received Pronunciation) accent', 'General American English accent', 'Australian English accent', 'Excited, enthusiastic, and joyful tone', 'Whispering voice, soft spoken').

Format each line of dialogue strictly in the following format:
[VoiceName - Accent Description]: Dialogue text

Example:
[Aoede - British English (Received Pronunciation) accent]: Welcome to today's deep dive.
[Zephyr - General American English accent]: Thanks for having me, excited to discuss this topic!

Provide only the formatted dialogue lines, without markdown conversational intro or outro text.`;

/**
 * Agente Director de Guiones usando @google/adk.
 */
export const scriptDirectorAgent = new LlmAgent({
    name: 'script-director',
    model: 'gemini-2.5-flash',
    instruction: SCRIPT_DIRECTOR_INSTRUCTION,
    tools: [GOOGLE_SEARCH]
});

/**
 * Ejecuta el agente director utilizando el SDK de @google/adk (InMemoryRunner y Gemini).
 */
export const runScriptDirector = async ({ topic, apiKey, modelName = 'gemini-2.5-flash' }) => {
    const cleanKey = apiKey?.trim();
    if (!cleanKey) {
        throw new Error('API Key requerida para ejecutar el Agente Director.');
    }

    // Instanciar modelo Gemini desde @google/adk
    const model = new Gemini({
        model: modelName || 'gemini-2.5-flash',
        apiKey: cleanKey
    });

    // Instanciar el agente con el modelo configurado y las herramientas
    const agent = new LlmAgent({
        name: 'script-director',
        model,
        instruction: SCRIPT_DIRECTOR_INSTRUCTION,
        tools: [GOOGLE_SEARCH]
    });

    // Ejecutar con el runner en memoria de @google/adk
    const runner = new InMemoryRunner({ agent });
    const events = runner.runEphemeral({
        userId: 'script-director-user',
        newMessage: {
            parts: [{ text: `Topic to write a dialogue about: ${topic}` }]
        }
    });

    let fullText = '';
    for await (const event of events) {
        const text = stringifyContent(event);
        if (text) {
            fullText += text;
        }
    }

    if (!fullText.trim()) {
        throw new Error('El Agente Director no produjo texto para el guion.');
    }

    return fullText.trim();
};
