# langTTY

langTTY is a browser-based translator built with Vue 3, TypeScript, Vite, and Tailwind CSS. It translates text and recorded speech with Gemini, then generates and plays spoken translations.

## Features

- Translate text between English, Thai, Vietnamese, Filipino, Indonesian, Spanish, French, Japanese, Korean, Chinese, and German.
- Record speech and transcribe it with Gemini.
- Automatically generate speech after a successful translation; use the audio player to replay it.
- Customize the Gemini model IDs used for translation, transcription, and text-to-speech.
- View session token usage by model.
- Switch the interface between English and Thai, and choose light or dark theme.

## Requirements

- Node.js 18.x, 20.x, or 22+
- A Google AI Studio API key with access to the configured Gemini models

## Getting started

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Add your API key from the key/settings button in the app. Speech recording also requires microphone permission from the browser.

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

## Gemini models

The default model IDs are:

| Task | Model |
| --- | --- |
| Translation | `gemini-4-hydrogen` |
| Speech to text | `gemini-3.5-transcribe` |
| Text to speech | `gemini-3.8-flash-lite-tts` |

Use **Customize** in the app to change model IDs. Availability and quota depend on the Google AI Studio project associated with your API key.

## API key and browser storage

This is a bring-your-own-key app. Each user enters their own Google AI Studio key; the app stores it in that browser tab's session storage and sends it directly to Google AI Studio with translation/transcription requests. Text and recorded audio are sent to Google for processing. This project has no application backend or server-side key proxy.

Browser storage is accessible to scripts running on the page, so this is not a suitable design for protecting an application owner's shared API key. Do not embed a private/shared key in the frontend or commit one to version control. Users should only enter keys they are comfortable using in a browser, and should apply available API restrictions and quotas. A product that uses an owner-managed key should put Gemini requests behind a secured backend.

Model preferences and token-usage totals are also kept for the current browser session. The interface language and theme are saved in local storage.
