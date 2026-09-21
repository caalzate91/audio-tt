import React, { useRef } from 'react';
import { triggerDownload } from '../models/audioCodec.js';

export default function AudioPlayerView({
    statusLog,
    globalLoading,
    onGenerateFullAudio,
    mergedAudioUrl,
    blocks
}) {
    const audioRef = useRef(null);

    const downloadAllTracks = () => {
        blocks.forEach((block, idx) => {
            if (block.audioUrl) {
                setTimeout(() => {
                    triggerDownload(block.audioUrl, `pista_${idx + 1}_${block.voice}_${block.accent.split(' ')[0]}.wav`);
                }, idx * 400);
            }
        });
    };

    return (
        <div className="border-t border-slate-700/60 pt-6 mt-2 flex flex-col gap-6">
            {/* Barra de estado en tiempo real */}
            {statusLog && (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-violet-500/30 text-xs font-mono text-violet-300 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                    <span>{statusLog}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onGenerateFullAudio}
                    disabled={globalLoading}
                    className={`flex-1 py-4 px-6 rounded-2xl font-bold text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                        globalLoading
                            ? 'bg-violet-800/50 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-550 hover:shadow-violet-900/30'
                    }`}
                >
                    {globalLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sintetizando Audio Completo con Gemini...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                            </svg>
                            Generar Audio Completo (1 sola petición a Gemini)
                        </>
                    )}
                </button>

                {blocks.some(b => b.audioUrl) && (
                    <button
                        onClick={downloadAllTracks}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 py-4 px-6 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Descargar Pistas Preescuchadas
                    </button>
                )}
            </div>

            {/* Reproductor de audio completo */}
            {mergedAudioUrl && (
                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 p-6 rounded-3xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                    <h3 className="font-bold text-indigo-400 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                        ¡Audio Completo Generado con Éxito!
                    </h3>

                    <audio
                        ref={audioRef}
                        controls
                        src={mergedAudioUrl}
                        className="w-full max-w-lg shadow-2xl rounded-full bg-slate-900 border border-slate-700"
                        autoPlay
                    >
                        Tu navegador no soporta el reproductor de audio.
                    </audio>

                    <button
                        onClick={() => triggerDownload(mergedAudioUrl, "dialogo_completo.wav")}
                        className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-2 mt-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Exportar Audio WAV Completo
                    </button>
                </div>
            )}
        </div>
    );
}
