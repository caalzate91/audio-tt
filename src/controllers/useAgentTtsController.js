import { useState } from 'react';
import { synthesizeSingleBlock, synthesizeFullScript } from '../agents/ttsOrchestratorAgent.js';
import { runScriptDirector } from '../agents/scriptDirectorAgent.js';

/**
 * Controlador para la interacción con los Agentes ADK y la síntesis de audio.
 */
export const useAgentTtsController = ({ apiKey, modelName, setBlocks, blocks, onScriptGenerated }) => {
    const [globalLoading, setGlobalLoading] = useState(false);
    const [agentLoading, setAgentLoading] = useState(false);
    const [mergedAudioUrl, setMergedAudioUrl] = useState(null);
    const [statusLog, setStatusLog] = useState('');
    const [ttsError, setTtsError] = useState('');

    /**
     * Ejecuta el Agente Director (@google/adk) para generar una escena investigada
     */
    const handleRunDirectorAgent = async (topic) => {
        if (!topic || !topic.trim()) {
            setTtsError('Por favor ingresa un tema o premisa para el Agente Director.');
            return;
        }

        setAgentLoading(true);
        setTtsError('');
        setStatusLog(`🎬 Agente Director investigando y redactando guion para: "${topic}"...`);

        try {
            const generatedScript = await runScriptDirector({
                topic,
                apiKey,
                modelName: 'gemini-2.5-flash'
            });

            setStatusLog('✅ Guion redactado por el Agente Director con éxito.');
            if (onScriptGenerated) {
                onScriptGenerated(generatedScript);
            }
        } catch (err) {
            console.error('[Agent Director Error]:', err);
            setTtsError(`Error en el Agente Director: ${err.message}`);
            setStatusLog(`❌ Error en Agente Director: ${err.message}`);
        } finally {
            setAgentLoading(false);
        }
    };

    /**
     * Preescucha de un bloque específico (1 sola línea)
     */
    const handlePreviewSingleBlock = async (id) => {
        const block = blocks.find(b => b.id === id);
        if (!block || !block.text.trim()) return;

        setBlocks(prev => prev.map(b => b.id === id ? { ...b, status: 'generating' } : b));
        setTtsError('');
        setStatusLog(`🎧 Preescuchando bloque #${id} (${block.voice})...`);

        try {
            const result = await synthesizeSingleBlock({
                block,
                apiKey,
                modelName
            });

            setBlocks(prev => prev.map(b => b.id === id ? {
                ...b,
                audioUrl: result.audioUrl,
                pcmData: result.pcmData,
                sampleRate: result.sampleRate,
                status: 'success'
            } : b));

            setStatusLog(`✅ Audio individual del bloque #${id} generado con éxito.`);
        } catch (err) {
            console.error('[TTS Preview Error]:', err);
            setBlocks(prev => prev.map(b => b.id === id ? { ...b, status: 'error' } : b));
            setTtsError(`Error al preescuchar bloque: ${err.message}`);
            setStatusLog(`❌ Error en bloque #${id}: ${err.message}`);
        }
    };

    /**
     * Generación del audio completo en 1 sola llamada a Gemini
     */
    const handleGenerateFullAudio = async () => {
        setGlobalLoading(true);
        setTtsError('');
        setMergedAudioUrl(null);
        setStatusLog(`🎙️ Agente TTS enviando guion completo (${blocks.length} líneas) en 1 sola llamada...`);

        try {
            const result = await synthesizeFullScript({
                blocks,
                apiKey,
                modelName
            });

            setMergedAudioUrl(result.audioUrl);
            setStatusLog(`✅ Audio completo sintetizado y listo para reproducir.`);
        } catch (err) {
            console.error('[TTS Full Audio Error]:', err);
            setTtsError(`Error al generar audio completo: ${err.message}`);
            setStatusLog(`❌ Error: ${err.message}`);
        } finally {
            setGlobalLoading(false);
        }
    };

    return {
        globalLoading,
        agentLoading,
        mergedAudioUrl,
        statusLog,
        ttsError,
        setTtsError,
        handleRunDirectorAgent,
        handlePreviewSingleBlock,
        handleGenerateFullAudio
    };
};
