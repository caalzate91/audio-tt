# Audio-TT (Generador de Audio Text-to-Speech con Gemini)

Este es un proyecto web construido con **React**, **Vite** y **TailwindCSS** que permite convertir texto (guiones) en archivos de audio reproducibles y descargables (en formato WAV) utilizando la API de **Gemini** (específicamente el modelo `gemini-2.5-flash-preview-tts`).

## 🚀 Características

- **Conversión de Texto a Audio (TTS)**: Escribe o pega cualquier guion de texto y conviértelo en voz en segundos.
- **Múltiples Voces**: Soporte para diferentes voces preconfiguradas del modelo de Gemini (por ejemplo, *Aoede*, *Zephyr*, *Puck*, *Charon*, *Kore*, *Fenrir*, *Leda*, *Orus*, *Callirrhoe*, *Umbriel*).
- **Reproducción Local**: Escucha el audio generado directamente desde el navegador.
- **Descarga de Audio**: Descarga el archivo de audio resultante en formato `.wav`.
- **Mecanismo de Reintento**: Reintentos automáticos con retroceso exponencial ante posibles fallos temporales de red o de la API.
- **Interfaz Moderna**: Diseño interactivo, limpio y adaptado para dispositivos móviles.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [pnpm](https://pnpm.io/) (o npm / yarn en su defecto)
- Una clave de API de Gemini (**Gemini API Key**)

---

## ⚙️ Instalación y Configuración

1. **Instalar Dependencias**:
   Abre una terminal en el directorio raíz del proyecto y ejecuta:
   ```bash
   pnpm install
   ```
   *(o `npm install` si prefieres usar npm).*

2. **Configurar las Variables de Entorno**:
   El proyecto utiliza variables de entorno para conectarse con la API de Gemini. 
   Crea o edita el archivo llamado `.env` en la raíz del proyecto y añade tu clave y (opcionalmente) el modelo:
   ```env
   VITE_GEMINI_API_KEY=TU_API_KEY_AQUÍ
   VITE_GEMINI_MODEL=gemini-2.5-flash-preview-tts
   ```

---

## 💻 Uso en Desarrollo

Para iniciar el servidor de desarrollo local y probar la aplicación:

```bash
pnpm dev
```
*(o `npm run dev`).*

Una vez iniciado, abre la URL que se muestra en la consola (usualmente `http://localhost:5173`) en tu navegador web.

---

## 📦 Construcción para Producción

Para compilar la aplicación optimizada para producción:

```bash
pnpm build
```
*(o `npm run build`).*

Los archivos compilados listos para desplegar se generarán dentro de la carpeta `dist/`.

---

## 🔍 ¿Cómo funciona internamente?

1. **Captura del Guion**: El usuario ingresa un texto y selecciona una de las voces disponibles en la interfaz.
2. **Petición HTTP a Gemini**: Se realiza una petición `POST` al endpoint:
   `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent`
   - Se configuran las modalidades de respuesta para recibir únicamente `"AUDIO"`.
   - Se envía la configuración de voz elegida por el usuario.
3. **Conversión PCM a WAV**: La respuesta de Gemini retorna datos de audio PCM en Base64. Dado que los navegadores no reproducen PCM directamente, la aplicación construye la cabecera del formato **WAV** en el cliente, inyecta los bytes de audio y genera un objeto URL (`URL.createObjectURL`) para que sea completamente reproducible y descargable.
