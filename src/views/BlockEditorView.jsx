import React from 'react';
import { VOICES, ACCENT_PRESETS } from '../models/dialogueModel.js';
import { triggerDownload } from '../models/audioCodec.js';

export default function BlockEditorView({
    blocks,
    onAddBlock,
    onRemoveBlock,
    onUpdateBlock,
    onMoveBlock,
    onPreviewBlock
}) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-300">Líneas de Diálogo</h3>
                <button
                    onClick={onAddBlock}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Agregar Línea
                </button>
            </div>

            <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {blocks.map((block, index) => (
                    <div
                        key={block.id}
                        className="bg-slate-700/40 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 relative transition-all duration-300 hover:border-slate-600"
                    >
                        {/* Controles superiores del bloque */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-slate-800 text-slate-400 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                                    {index + 1}
                                </span>

                                {/* Selector de Voz */}
                                <select
                                    value={block.voice}
                                    onChange={(e) => onUpdateBlock(block.id, 'voice', e.target.value)}
                                    className="bg-slate-800 text-slate-100 text-sm font-semibold rounded-lg px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-violet-500"
                                >
                                    {VOICES.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>

                                {/* Input de Acento & Presets */}
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        value={block.accent}
                                        onChange={(e) => onUpdateBlock(block.id, 'accent', e.target.value)}
                                        placeholder="Acento o tono..."
                                        className="bg-slate-800 text-slate-100 text-xs rounded-lg px-2 py-1.5 border border-slate-600 max-w-[150px] sm:max-w-xs focus:outline-none focus:border-violet-500"
                                    />
                                    <select
                                        onChange={(e) => onUpdateBlock(block.id, 'accent', e.target.value)}
                                        value=""
                                        className="bg-slate-800 text-slate-400 text-xs rounded-lg p-1.5 border border-slate-600 focus:outline-none"
                                    >
                                        <option value="" disabled>Presets...</option>
                                        {ACCENT_PRESETS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Acciones de reordenar y eliminar */}
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                    onClick={() => onMoveBlock(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all"
                                    title="Mover arriba"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onMoveBlock(index, 'down')}
                                    disabled={index === blocks.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all"
                                    title="Mover abajo"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onRemoveBlock(block.id)}
                                    className="p-1 text-red-400 hover:text-red-300 transition-all ml-2"
                                    title="Eliminar línea"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Input de Guion del bloque */}
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <textarea
                                rows="2"
                                value={block.text}
                                onChange={(e) => onUpdateBlock(block.id, 'text', e.target.value)}
                                placeholder="Introduce el diálogo de este personaje..."
                                className="w-full bg-slate-800 text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-violet-500 resize-none text-sm"
                            />

                            {/* Mini reproductor y botón de preescucha */}
                            <div className="flex flex-col gap-2 items-center justify-end w-full sm:w-auto min-w-[150px]">
                                {block.audioUrl ? (
                                    <div className="flex flex-col gap-1 items-center">
                                        <audio src={block.audioUrl} controls className="w-40 h-8 scale-90" />
                                        <button
                                            onClick={() => triggerDownload(block.audioUrl, `dialogo_${index + 1}.wav`)}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                                        >
                                            Descargar WAV
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onPreviewBlock(block.id)}
                                        disabled={block.status === 'generating'}
                                        className={`w-full text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                            block.status === 'generating'
                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                                        }`}
                                    >
                                        {block.status === 'generating' ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Generando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                                </svg>
                                                Preescuchar
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
