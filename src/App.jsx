import React, { useState } from 'react';
import { useDialogueController } from './controllers/useDialogueController.js';
import { useAgentTtsController } from './controllers/useAgentTtsController.js';
import HeaderView from './views/HeaderView.jsx';
import AgentDirectorView from './views/AgentDirectorView.jsx';
import BlockEditorView from './views/BlockEditorView.jsx';
import RawScriptView from './views/RawScriptView.jsx';
import AudioPlayerView from './views/AudioPlayerView.jsx';

/**
 * Vista Principal (Root View) de la Arquitectura MVC.
 * Conecta los controladores y agentes ADK con las vistas.
 */
export default function App() {
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const envModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-preview-tts';

    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || envApiKey);
    const [modelName, setModelName] = useState(() => localStorage.getItem('gemini_model') || envModel);
    const [showSettings, setShowSettings] = useState(false);

    // Controlador de Modelo de Diálogos
    const {
        blocks,
        setBlocks,
        rawScript,
        setRawScript,
        activeTab,
        setActiveTab,
        dialogueError,
        addBlock,
        removeBlock,
        updateBlock,
        moveBlock,
        parseAndSetRawScript,
        loadGeneratedScript,
        syncBlocksToRaw
    } = useDialogueController();

    // Controlador de Agentes ADK y Síntesis TTS
    const {
        globalLoading,
        agentLoading,
        mergedAudioUrl,
        statusLog,
        ttsError,
        handleRunDirectorAgent,
        handlePreviewSingleBlock,
        handleGenerateFullAudio
    } = useAgentTtsController({
        apiKey,
        modelName,
        setBlocks,
        blocks,
        onScriptGenerated: (newScript) => {
            loadGeneratedScript(newScript);
        }
    });

    const handleApiKeyChange = (key) => {
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
    };

    const handleModelChange = (model) => {
        setModelName(model);
        localStorage.setItem('gemini_model', model);
    };

    const currentError = dialogueError || ttsError;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
                
                {/* Cabecera y Configuración */}
                <HeaderView
                    apiKey={apiKey}
                    onApiKeyChange={handleApiKeyChange}
                    modelName={modelName}
                    onModelChange={handleModelChange}
                    showSettings={showSettings}
                    setShowSettings={setShowSettings}
                />

                {/* Tabs de Navegación */}
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => {
                            if (activeTab === 'raw') parseAndSetRawScript();
                            setActiveTab('blocks');
                        }}
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
                        onClick={() => {
                            syncBlocksToRaw(blocks);
                            setActiveTab('raw');
                        }}
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

                    <button
                        onClick={() => setActiveTab('agent')}
                        className={`flex-1 py-4 text-center font-bold transition-all text-sm sm:text-base border-b-2 flex items-center justify-center gap-2 ${
                            activeTab === 'agent'
                                ? 'border-violet-500 text-violet-400 bg-slate-800'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Agente ADK
                    </button>
                </div>

                {/* Área de Contenido */}
                <div className="p-6 sm:p-8 flex flex-col gap-6">

                    {currentError && (
                        <div className="p-4 bg-red-500/20 text-red-200 rounded-2xl border border-red-500/40 flex items-start gap-3">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p className="text-sm font-medium">{currentError}</p>
                        </div>
                    )}

                    {/* Tab 1: Agente ADK */}
                    {activeTab === 'agent' && (
                        <AgentDirectorView
                            onGenerate={handleRunDirectorAgent}
                            loading={agentLoading}
                        />
                    )}

                    {/* Tab 2: Editor de Bloques */}
                    {activeTab === 'blocks' && (
                        <BlockEditorView
                            blocks={blocks}
                            onAddBlock={addBlock}
                            onRemoveBlock={removeBlock}
                            onUpdateBlock={updateBlock}
                            onMoveBlock={moveBlock}
                            onPreviewBlock={handlePreviewSingleBlock}
                        />
                    )}

                    {/* Tab 3: Script Raw */}
                    {activeTab === 'raw' && (
                        <RawScriptView
                            rawScript={rawScript}
                            onRawScriptChange={setRawScript}
                            onImport={parseAndSetRawScript}
                        />
                    )}

                    {/* Reproductor de Audio y Acciones Globales */}
                    <AudioPlayerView
                        statusLog={statusLog}
                        globalLoading={globalLoading}
                        onGenerateFullAudio={handleGenerateFullAudio}
                        mergedAudioUrl={mergedAudioUrl}
                        blocks={blocks}
                    />
                </div>
            </div>
        </div>
    );
}