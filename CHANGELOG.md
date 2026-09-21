# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo siguiendo los estándares de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y adhiriéndose a [Semantic Versioning (SemVer 2.0.0)](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-21

### 🚀 Añadido (Added)
- **Arquitectura MVC Modular**:
  - **Modelos (`src/models/`)**:
    - `dialogueModel.js`: Definición de voces disponibles (`VOICES`), catálogo de presets de acento (`ACCENT_PRESETS`), estructuras de datos y parsers de scripts en texto plano.
    - `audioCodec.js`: Utilidades para codificación de cabeceras WAV en formato Blob a partir de buffers PCM (Uint8Array / Base64) y descarga de archivos de audio.
  - **Controladores (`src/controllers/`)**:
    - `useDialogueController.js`: Hook para administrar el estado de los bloques de diálogo (creación, edición, eliminación, reordenamiento, sincronización bidireccional y carga de guiones).
    - `useAgentTtsController.js`: Hook para orquestar la interacción con los agentes de IA, preescucha de bloques individuales y generación de audio completo en una sola petición.
  - **Vistas (`src/views/`)**:
    - `HeaderView.jsx`: Barra superior con acceso al panel de ajustes de API Key y modelo de Gemini.
    - `AgentDirectorView.jsx`: Pestaña para interacción con el agente guionista que investiga temáticas en tiempo real.
    - `BlockEditorView.jsx`: Editor visual e interactivo de líneas de diálogo por personaje con selectores de voz, acento y preescucha.
    - `RawScriptView.jsx`: Editor de texto plano para importar y sincronizar guiones rápidamente.
    - `AudioPlayerView.jsx`: Barra de estado en tiempo real, reproductor de audio WAV consolidado y botones de exportación.
  - **Componente Principal (`src/App.jsx`)**: Refactorizado como vista integradora raíz conectando controladores y sub-vistas.
- **Integración de Agentes con `@google/adk`**:
  - `src/agents/scriptDirectorAgent.js`: Agente `LlmAgent` con herramienta `GOOGLE_SEARCH` para investigar temas y redactar guiones multivoz automáticamente.
  - `src/agents/ttsOrchestratorAgent.js`: Agente `LlmAgent` especializado en dirección vocal y orquestación de llamadas hacia Gemini TTS.
- **Configuración Dinámica de Variables de Entorno**:
  - Soporte para la variable de entorno `VITE_GEMINI_MODEL` (por defecto `gemini-2.5-flash-preview-tts`).
  - Drawer desplegable en la interfaz para configurar o cambiar la API Key y el modelo directamente desde el navegador, con persistencia en `localStorage`.
  - Archivo de plantilla `.env.example` para documentar las variables necesarias.

### ⚡ Optimizado (Changed)
- **Generación Unificada de Audio (1 sola llamada a la API)**:
  - El botón principal *“Generar Audio Completo”* consolida todas las líneas del guion en un único prompt multirrol y realiza **una única petición a Gemini TTS**, reduciendo drásticamente el consumo de tokens, cuotas y tiempo de espera.
- **Preescucha Aislada por Línea**:
  - Solo se realizan llamadas individuales a la API de Gemini cuando el usuario presiona el botón *“Preescuchar”* en un bloque específico de diálogo.
- **Configuración de Dependencias y Build con pnpm**:
  - Aprobación de scripts de construcción en `pnpm-workspace.yaml` para las dependencias nativas requeridas por `@google/adk` (`@google/genai`, `cpu-features`, `protobufjs`, `ssh2`).

---

## [0.1.0] - 2026-09-17

### 🚀 Añadido (Added)
- Versión inicial del generador Text-to-Speech (TTS) con interfaz en React, Vite y TailwindCSS.
- Integración básica con el modelo `gemini-2.5-flash-preview-tts`.
- Soporte para selección de voces predefinidas de Gemini y descarga en formato `.wav`.
