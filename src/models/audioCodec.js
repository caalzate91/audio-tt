// Decodificación PCM y construcción de cabecera WAV

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

export const pcmToWavUrl = (base64Data, sampleRate = 24000) => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return {
        url: pcmToWavUrlFromUint8(bytes, sampleRate),
        bytes
    };
};

export const triggerDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
