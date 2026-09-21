// Decodificación PCM y construcción de cabecera WAV para datos de audio de @google/adk

/**
 * Convierte un Uint8Array de datos PCM a una URL WAV reproducible.
 */
export const pcmToWavUrlFromUint8 = (uint8Array, sampleRate = 24000) => {
    const buffer = new ArrayBuffer(44 + uint8Array.length);
    const view = new DataView(buffer);

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // Cabecera RIFF/WAVE
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + uint8Array.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM = 1
    view.setUint16(22, 1, true); // Mono = 1
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); // 16 bits por muestra
    writeString(view, 36, 'data');
    view.setUint32(40, uint8Array.length, true);

    // Escribir bytes PCM
    const dataArray = new Uint8Array(buffer, 44);
    dataArray.set(uint8Array);

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
};

/**
 * Convierte datos de audio (Base64 string, Uint8Array o ArrayBuffer) a WAV URL y bytes.
 */
export const processAudioDataToWav = (rawData, sampleRate = 24000, mimeType = '') => {
    let bytes;

    if (rawData instanceof Uint8Array) {
        bytes = rawData;
    } else if (rawData instanceof ArrayBuffer) {
        bytes = new Uint8Array(rawData);
    } else if (typeof rawData === 'string') {
        const binaryString = atob(rawData);
        const len = binaryString.length;
        bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
    } else if (rawData && typeof rawData === 'object' && rawData.data) {
        return processAudioDataToWav(rawData.data, sampleRate, rawData.mimeType || mimeType);
    } else {
        throw new Error('Formato de datos de audio no reconocido por el decodificador.');
    }

    // Si ya tiene cabecera RIFF/WAV o es otro contenedor
    if (mimeType.includes('audio/wav') || (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46)) {
        const blob = new Blob([bytes], { type: 'audio/wav' });
        return {
            url: URL.createObjectURL(blob),
            bytes
        };
    }

    // Convertir PCM crudo a WAV con cabecera estándar
    return {
        url: pcmToWavUrlFromUint8(bytes, sampleRate),
        bytes
    };
};

export const pcmToWavUrl = (base64Data, sampleRate = 24000) => {
    return processAudioDataToWav(base64Data, sampleRate);
};

export const triggerDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
