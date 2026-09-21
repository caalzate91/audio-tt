import React from 'react';

export default function HeaderView({
    apiKey,
    onApiKeyChange,
    modelName,
    onModelChange,
    showSettings,
    setShowSettings
}) {
    return (
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="bg-slate-900/60 hover:bg-slate-900/80 text-violet-200 hover:text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border border-violet-400/30"
                >
                    <span className={`w-2 h-2 rounded-full ${apiKey.trim() ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`}></span>
                    {apiKey.trim() ? 'API Key Configurada' : 'Configurar API Key'}
                </button>
                <div className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider hidden sm:block">
                    ADK Agents MVC
                </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3 tracking-tight">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                Studio Audio Script (TTS)
            </h1>
            <p className="mt-2 text-violet-100 opacity-90 text-sm sm:text-base max-w-2xl">
                Arquitectura MVC impulsada por agentes <code>@google/adk</code>. Genera diálogos multivoz con investigación web o edita bloques personalizados.
            </p>

            {showSettings && (
                <div className="mt-4 p-4 bg-slate-900/90 rounded-2xl border border-violet-400/40 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-violet-200 flex justify-between">
                            <span>Gemini API Key (o variable <code>VITE_GEMINI_API_KEY</code>)</span>
                            <span className="text-slate-400">{apiKey.trim() ? '●●●● Guardada' : 'No configurada'}</span>
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            placeholder="Pega tu Gemini API Key (AIzaSy...)"
                            className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl text-sm border border-slate-700 focus:outline-none focus:border-violet-400 font-mono"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-violet-200 flex justify-between">
                            <span>Modelo de Gemini TTS (o variable <code>VITE_GEMINI_MODEL</code>)</span>
                            <span className="text-slate-400 font-mono text-[11px]">{modelName}</span>
                        </label>
                        <input
                            type="text"
                            value={modelName}
                            onChange={(e) => onModelChange(e.target.value)}
                            placeholder="gemini-2.5-flash-preview-tts"
                            className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-xl text-sm border border-slate-700 focus:outline-none focus:border-violet-400 font-mono"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
