import { useState } from 'react';
import {
    initialBlocks,
    createDefaultBlock,
    blocksToRawScript,
    parseRawScriptToBlocks
} from '../models/dialogueModel.js';

/**
 * Controlador para la gestión del estado de los diálogos y bloques.
 */
export const useDialogueController = () => {
    const [blocks, setBlocks] = useState(initialBlocks);
    const [rawScript, setRawScript] = useState(() => blocksToRawScript(initialBlocks));
    const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'raw' | 'agent'
    const [dialogueError, setDialogueError] = useState('');

    const syncBlocksToRaw = (currentBlocks) => {
        const text = blocksToRawScript(currentBlocks);
        setRawScript(text);
    };

    const addBlock = () => {
        const newBlock = createDefaultBlock();
        const updated = [...blocks, newBlock];
        setBlocks(updated);
        syncBlocksToRaw(updated);
    };

    const removeBlock = (id) => {
        if (blocks.length <= 1) {
            setDialogueError("Debes mantener al menos una línea de diálogo.");
            return;
        }
        const updated = blocks.filter(b => b.id !== id);
        setBlocks(updated);
        syncBlocksToRaw(updated);
        setDialogueError('');
    };

    const updateBlock = (id, field, value) => {
        const updated = blocks.map(b => {
            if (b.id === id) {
                return { ...b, [field]: value, audioUrl: null, pcmData: null, status: 'idle' };
            }
            return b;
        });
        setBlocks(updated);
        syncBlocksToRaw(updated);
    };

    const moveBlock = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;

        const updated = [...blocks];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = updated[index];
        updated[index] = updated[swapIndex];
        updated[swapIndex] = temp;

        setBlocks(updated);
        syncBlocksToRaw(updated);
    };

    const parseAndSetRawScript = () => {
        const parsed = parseRawScriptToBlocks(rawScript);
        if (parsed.length > 0) {
            setBlocks(parsed);
            setActiveTab('blocks');
            setDialogueError('');
        } else {
            setDialogueError("No se encontraron líneas válidas. Formato requerido: [Voz - Acento]: Texto");
        }
    };

    const loadGeneratedScript = (scriptText) => {
        const parsed = parseRawScriptToBlocks(scriptText);
        if (parsed.length > 0) {
            setBlocks(parsed);
            setRawScript(scriptText);
            setActiveTab('blocks');
            setDialogueError('');
        }
    };

    return {
        blocks,
        setBlocks,
        rawScript,
        setRawScript,
        activeTab,
        setActiveTab,
        dialogueError,
        setDialogueError,
        addBlock,
        removeBlock,
        updateBlock,
        moveBlock,
        parseAndSetRawScript,
        loadGeneratedScript,
        syncBlocksToRaw
    };
};
