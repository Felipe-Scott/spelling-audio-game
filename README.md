# Spelling Audio Game

A small online game for children to choose the correct spelling of a word after listening to an audio clip.

## Features

- English or French mode
- Parent types the correct word
- Parent pastes a Vocaroo or direct audio link
- Three multiple-choice spellings: one correct, two subtly wrong
- Manual difficulty from 1 to 5
- Session score and accuracy
- Child mode for a cleaner play screen
- No login and no paid APIs required

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

This project is ready for Vercel, Netlify, or any static hosting service that supports Vite.

## Notes

- Vocaroo links are converted automatically into playable MP3 URLs.
- The app uses the typed word as the ground truth. Audio is used only for playback.
