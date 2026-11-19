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

## Gemini models

The default model IDs are:

| Task | Model |
| --- | --- |
| Translation | `gemini-4-hydrogen` |
| Speech to text | `gemini-3.5-transcribe` |
| Text to speech | `gemini-3.8-flash-lite-tts` |

Use **Customize** in the app to change model IDs. Availability and quota depend on the Google AI Studio project associated with your API key.

## API key and browser storage

The API key is entered in the app and stored in the current browser tab's session storage. Requests are sent directly from the browser to Google AI Studio; this project does not include a server-side key proxy. Do not put an API key in source code or commit it to version control. For a public deployment, use an appropriate server-side design to protect API credentials.

Model preferences and token-usage totals are also kept for the current browser session. The interface language and theme are saved in local storage.
