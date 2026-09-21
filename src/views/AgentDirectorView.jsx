import React, { useState } from 'react';

export default function AgentDirectorView({ onGenerate, loading }) {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (topic.trim()) {
            onGenerate(topic);
        }
    };

    return (
        <div className="bg-slate-850 border border-indigo-500/30 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        Agente Guionista ADK (LlmAgent con Google Search)
                    </h3>
                    <p className="text-xs text-slate-400">
                        Escribe una temática y el agente investigará con Google Search para escribir una escena multivoz automáticamente.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ej: Debate sobre computación cuántica vs criptografía tradicional"
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !topic.trim()}
                    className={`px-5 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all ${
                        loading || !topic.trim()
                            ? 'bg-indigo-900/40 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-md active:scale-95'
                    }`}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Investigando...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            Generar Guion
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
