import React from 'react';
import { VOICES } from '../models/dialogueModel.js';

export default function RawScriptView({ rawScript, onRawScriptChange, onImport }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-300">Pega tu Guion en Formato Script</h3>
                <button
                    onClick={onImport}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all active:scale-95 shadow-md"
                >
                    Importar e ir a Bloques
                </button>
            </div>

            <textarea
                value={rawScript}
                onChange={(e) => onRawScriptChange(e.target.value)}
                rows="10"
                placeholder={`Usa uno de los siguientes formatos:\n[Aoede - British English]: Hola amigo.\nZephyr (American English): Hello standard voice.\nKore: Dialogue without explicit accent.`}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-slate-100 font-mono text-sm focus:outline-none focus:border-violet-500"
            />

            <div className="bg-slate-700/20 border border-slate-700/60 p-4 rounded-xl text-xs text-slate-400 flex flex-col gap-2">
                <p className="font-semibold text-slate-300">Instrucciones de formato:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                    <li>Formatos soportados: <code className="text-indigo-300">[Voz - Acento]: Texto</code> o <code className="text-indigo-300">Voz (Acento): Texto</code> o <code className="text-indigo-300">Voz: Texto</code></li>
                    <li>Las voces válidas son: {VOICES.join(', ')}.</li>
                    <li>Los acentos pueden ser descripciones de texto libres (ej: "Australian English accent", "London Cockney accent", "excited tone").</li>
                </ul>
            </div>
        </div>
    );
}
