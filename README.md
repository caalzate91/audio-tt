# Audio-TT (Generador de Audio Text-to-Speech con Gemini y Agentes ADK)

Este es un proyecto web construido con **React**, **Vite**, **TailwindCSS** y **`@google/adk`** bajo una arquitectura **MVC (Modelo-Vista-Controlador)**. Permite redactar e investigar guiones multivoz automáticamente con agentes de IA y convertir diálogos completos en archivos de audio reproducibles y descargables (formato WAV) utilizando la API de **Google Gemini TTS** (`gemini-2.5-flash-preview-tts` o configurable).

## 🚀 Características

- **Arquitectura MVC Modular**: Código desacoplado en Modelos, Vistas y Controladores para máxima escalabilidad y mantenibilidad.
- **Agentes Inteligentes con `@google/adk`**:
  - **Agente Guionista / Director (`scriptDirectorAgent`)**: Agente `LlmAgent` equipado con la herramienta `GOOGLE_SEARCH` para investigar temáticas y redactar guiones multivoz estructurados.
  - **Agente Orquestador TTS (`ttsOrchestratorAgent`)**: Agente `LlmAgent` especializado en dirección vocal, modulación de acentos y orquestación de la síntesis de audio.
- **Generación Eficiente de Audio (1 Sola Petición API)**: Genera todo el audio del guion consolidado en una sola llamada a Gemini, reduciendo drásticamente el consumo de tokens y el tiempo de respuesta.
- **Preescucha Aislada por Línea**: Permite escuchar y validar cada línea de diálogo por separado antes de exportar el resultado final.
- **Múltiples Voces y Acentos**: Soporte para voces de Gemini (*Aoede*, *Zephyr*, *Puck*, *Charon*, *Kore*, *Fenrir*, *Leda*, *Orus*, *Callirrhoe*, *Umbriel*) y personalización de acentos y emociones.
- **Editor de Guion en Texto Plano (Raw Script)**: Parser bidireccional que permite importar y exportar guiones en formatos estándar como `[Voz - Acento]: Texto`.
- **Configuración Dinámica de API Key y Modelo**: Drawer interactivo en la interfaz para configurar credenciales y modelo con persistencia en `localStorage`.
- **Reproducción y Descarga Local**: Escucha y descarga el audio final unificado o las pistas individuales en formato `.wav`.

---

## 🏛️ Arquitectura del Proyecto (MVC)

```
src/
├── agents/                      # Agentes creados con @google/adk
│   ├── scriptDirectorAgent.js   # Agente guionista con GOOGLE_SEARCH
│   └── ttsOrchestratorAgent.js  # Agente de dirección vocal y síntesis TTS
├── models/                      # Capa de Modelo y Codecs de Audio
│   ├── dialogueModel.js         # Estructuras de datos, voces, acentos y parser
│   └── audioCodec.js            # Ensamblado de cabeceras WAV y conversión PCM
├── controllers/                 # Capa de Controladores (Hooks de negocio)
│   ├── useDialogueController.js # Estado de bloques, edición y sincronización
│   └── useAgentTtsController.js # Orquestación de llamadas a agentes y audio
├── views/                       # Capa de Vistas modulares
│   ├── HeaderView.jsx           # Cabecera y panel de configuración
│   ├── AgentDirectorView.jsx    # Interfaz del Agente Guionista con búsqueda web
│   ├── BlockEditorView.jsx      # Editor visual de bloques y preescucha
│   ├── RawScriptView.jsx        # Editor de guion en texto plano
│   └── AudioPlayerView.jsx      # Reproductor WAV, estado y descargas
└── App.jsx                      # Vista integradora raíz
```

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
   Copia el archivo de ejemplo [.env.example](.env.example) o crea un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_GEMINI_API_KEY=TU_API_KEY_AQUÍ
   VITE_GEMINI_MODEL=gemini-2.5-flash-preview-tts
   ```
   *(Nota: También puedes ingresar tu clave de API directamente en la interfaz web desde el botón "Configurar API Key").*

---

## 💻 Uso en Desarrollo

Para iniciar el servidor de desarrollo local:

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

1. **Generación con Agente Guionista (Opcional)**: El usuario introduce una temática en la pestaña *Agente ADK*. El agente `scriptDirectorAgent` investiga en la web con `GOOGLE_SEARCH` y redacta el diálogo asignando personajes y estilos.
2. **Edición de Diálogos**: El usuario puede ajustar los textos, personajes, acentos y ordenar las intervenciones en el *Editor de Bloques* o en *Script Raw*.
3. **Preescucha Individual**: Al pulsar *Preescuchar* en una línea específica, el agente `ttsOrchestratorAgent` procesa de forma aislada ese bloque con `InMemoryRunner` de `@google/adk`.
4. **Síntesis Completa en 1 Llamada**: Al hacer clic en *Generar Audio Completo*, el agente `ttsOrchestratorAgent` consolida todo el guion con las instrucciones de dirección de cada personaje y ejecuta la síntesis de audio de todo el guion de forma nativa con `InMemoryRunner` de `@google/adk` sin endpoints HTTP manuales.
5. **Conversión PCM a WAV en el Cliente**: La respuesta con audio PCM en Base64 es procesada por `audioCodec.js`, ensamblando la cabecera del formato **WAV** directamente en el navegador y generando un objeto URL (`Blob`) listo para su reproducción y descarga.
