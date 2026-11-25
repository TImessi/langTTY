# langTTY

langTTY is a browser-based translator built with Vue 3, TypeScript, Vite, and Tailwind CSS. It translates text and recorded speech with multiple AI providers, then generates and plays spoken translations.

**Try langTTY online:** [https://langtty.vercel.app](https://langtty.vercel.app)

## Features

- Translate text between English, Thai, Vietnamese, Filipino, Indonesian, Spanish, French, Japanese, Korean, Chinese, and German.
- Record speech and transcribe it with any supported AI provider.
- Automatically generate speech after a successful translation; use the audio player to replay it.
- Customize the model IDs used for translation, transcription, and text-to-speech per provider.
- View session token usage by model.
- Switch the interface between English and Thai, and choose light or dark theme.

## Supported AI Providers

The app supports multiple AI providers, each with their own model capabilities:

| Provider | Capabilities | Default Models (customizable) |
| --- | --- | --- |
| **Google Gemini** | Translation, Transcription, Text‑to‑Speech | `gemini-4-hydrogen`, `gemini-3.5-transcribe`, `gemini-3.8-flash-lite-tts` |
| **OpenAI** | Translation, Transcription, Text‑to‑Speech | `gpt-4.1-nano`, `gpt-4o-transcribe`, `tts-1` |
| **Groq** | Translation, Transcription | `llama-3.3-70b-versatile`, `whisper-large-v3` |
| **OpenRouter** | Translation | `google/gemini-2.5-flash` |

Each provider must have an API key saved in the app (via the **API keys** button). Only providers with saved keys appear in the model selection dropdown.

## Requirements

- Node.js 18.x, 20.x, or 22+
- API keys for the providers you want to use (managed per‑provider in the app)

## Getting started

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Add your API keys from the **API keys** button in the app. Speech recording also requires microphone permission from the browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |

## Deploy to Vercel

Import the GitHub repository into Vercel and deploy it as a Vite project. The default settings are:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none required

Vercel can redeploy the site when changes are pushed to the connected GitHub branch.

## Model configuration

Each task (translation, transcription, text‑to‑speech) can use a different provider and model. Select the provider and model from the **Task configuration** panel. Only providers with saved API keys are available. When you change the provider, the app suggests default model IDs for that provider, which you can override.

The app stores per‑provider API keys and per‑task model selections in the browser's session storage. These settings persist for the current session only.

## API key and model storage

This is a bring‑your‑own‑key app. Each user enters their own API keys for each provider; the app stores them in that browser tab's session storage and sends them directly to the respective AI providers with translation/transcription/requests. This project has no application backend or server‑side key proxy.

Browser storage is accessible to scripts running on the page, so this is not a suitable design for protecting an application owner's shared API key. Do not embed a private/shared key in the frontend or commit one to version control. Users should only enter keys they are comfortable using in a browser, and should apply available API restrictions and quotas.

Model preferences and token‑usage totals are also kept for the current browser session. The interface language and theme are saved in local storage.
