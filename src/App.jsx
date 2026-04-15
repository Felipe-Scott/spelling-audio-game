import React, { useMemo, useState } from "react";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeWord(word) {
  return word.trim();
}

function stripAccents(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function replaceAt(word, index, replacement) {
  return word.slice(0, index) + replacement + word.slice(index + 1);
}

function removeChar(word) {
  if (word.length < 3) return word;
  const i = Math.floor(Math.random() * word.length);
  return word.slice(0, i) + word.slice(i + 1);
}

function duplicateChar(word) {
  if (word.length < 2) return word;
  const i = Math.floor(Math.random() * word.length);
  return word.slice(0, i + 1) + word[i] + word.slice(i + 1);
}

function swapAdjacent(word) {
  if (word.length < 2) return word;
  const i = Math.floor(Math.random() * (word.length - 1));
  const chars = word.split("");
  [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
  return chars.join("");
}

function replaceVowel(word, lang) {
  const vowels = lang === "fr" ? ["a", "e", "i", "o", "u", "y"] : ["a", "e", "i", "o", "u"];
  const positions = [...word]
    .map((char, index) => ({ char, index }))
    .filter(({ char }) => vowels.includes(char.toLowerCase()));

  if (!positions.length) return word;

  const { char, index } = pickOne(positions);
  const replacementChoices = vowels.filter((vowel) => vowel !== char.toLowerCase());
  const replacement = pickOne(replacementChoices);
  return replaceAt(word, index, char === char.toUpperCase() ? replacement.toUpperCase() : replacement);
}

function keyboardNeighbor(word) {
  const map = {
    a: ["s", "q", "z"],
    b: ["v", "n", "g"],
    c: ["x", "v", "f"],
    d: ["s", "f", "e"],
    e: ["w", "r", "d"],
    f: ["d", "g", "r"],
    g: ["f", "h", "t"],
    h: ["g", "j", "y"],
    i: ["u", "o", "k"],
    j: ["h", "k", "u"],
    k: ["j", "l", "i"],
    l: ["k", "o"],
    m: ["n", "j"],
    n: ["b", "m", "h"],
    o: ["i", "p", "l"],
    p: ["o", "l"],
    q: ["w", "a"],
    r: ["e", "t", "f"],
    s: ["a", "d", "w"],
    t: ["r", "y", "g"],
    u: ["y", "i", "j"],
    v: ["c", "b", "f"],
    w: ["q", "e", "s"],
    x: ["z", "c", "s"],
    y: ["t", "u", "h"],
    z: ["x", "a"],
  };

  const positions = [...word]
    .map((char, index) => ({ char, index }))
    .filter(({ char }) => map[char.toLowerCase()]);

  if (!positions.length) return word;

  const { char, index } = pickOne(positions);
  const replacement = pickOne(map[char.toLowerCase()]);
  return replaceAt(word, index, char === char.toUpperCase() ? replacement.toUpperCase() : replacement);
}

function accentMutation(word, lang) {
  if (lang !== "fr") return stripAccents(word);

  const accentRules = [
    [/e/g, "é"],
    [/é/g, "e"],
    [/è/g, "e"],
    [/a/g, "à"],
    [/u/g, "ù"],
    [/c/g, "ç"],
  ];

  const applicable = accentRules.filter(([pattern]) => pattern.test(word));
  if (!applicable.length) return stripAccents(word);

  const [pattern, replacement] = pickOne(applicable);
  return word.replace(pattern, replacement);
}

function phoneticMutation(word, lang) {
  const rules = lang === "fr"
    ? [
        [/ch/gi, "sh"],
        [/ou/gi, "u"],
        [/ai/gi, "ei"],
        [/é/gi, "e"],
        [/è/gi, "e"],
        [/qu/gi, "k"],
      ]
    : [
        [/ph/gi, "f"],
        [/ck/gi, "k"],
        [/ie/gi, "ei"],
        [/ea/gi, "ee"],
        [/k/gi, "c"],
      ];

  const applicable = rules.filter(([pattern]) => pattern.test(word));
  if (!applicable.length) return word;

  const [pattern, replacement] = pickOne(applicable);
  return word.replace(pattern, replacement);
}

function mutateWord(word, lang, level) {
  const clean = normalizeWord(word);
  const generatorsByLevel = {
    1: [removeChar, duplicateChar, (value) => replaceVowel(value, lang), (value) => accentMutation(value, lang)],
    2: [swapAdjacent, removeChar, duplicateChar, (value) => replaceVowel(value, lang), keyboardNeighbor, (value) => accentMutation(value, lang)],
    3: [swapAdjacent, removeChar, duplicateChar, (value) => replaceVowel(value, lang), keyboardNeighbor, (value) => accentMutation(value, lang), (value) => phoneticMutation(value, lang)],
    4: [swapAdjacent, removeChar, duplicateChar, (value) => replaceVowel(value, lang), keyboardNeighbor, (value) => accentMutation(value, lang), (value) => phoneticMutation(value, lang)],
    5: [swapAdjacent, removeChar, duplicateChar, (value) => replaceVowel(value, lang), keyboardNeighbor, (value) => accentMutation(value, lang), (value) => phoneticMutation(value, lang)],
  };

  const pool = generatorsByLevel[level] || generatorsByLevel[3];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    let candidate = pickOne(pool)(clean);

    if (level >= 4 && Math.random() < 0.4) {
      candidate = pickOne(pool)(candidate);
    }
    if (level === 5 && Math.random() < 0.35) {
      candidate = pickOne(pool)(candidate);
    }

    if (candidate && candidate !== clean) return candidate;
  }

  return clean + (lang === "fr" ? "e" : "s");
}

function buildOptions(word, lang, level) {
  const correct = normalizeWord(word);
  const wrongs = new Set();

  let attempts = 0;
  while (wrongs.size < 2 && attempts < 80) {
    const candidate = mutateWord(correct, lang, level);
    if (candidate !== correct) wrongs.add(candidate);
    attempts += 1;
  }

  while (wrongs.size < 2) {
    wrongs.add(correct + String.fromCharCode(97 + wrongs.size));
  }

  return shuffle([correct, ...Array.from(wrongs)]);
}

function parseVocarooLink(url) {
  const trimmed = url.trim();
  if (!trimmed) return "";

  const patterns = [
    /vocaroo\.com\/(?:embed\/)?([a-zA-Z0-9]+)/,
    /voca\.ro\/([a-zA-Z0-9]+)/,
    /media\.vocaroo\.com\/mp3\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return `https://media.vocaroo.com/mp3/${match[1]}`;
    }
  }

  return trimmed;
}

export default function App() {
  const [language, setLanguage] = useState("en");
  const [difficulty, setDifficulty] = useState(3);
  const [wordInput, setWordInput] = useState("");
  const [audioLink, setAudioLink] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [currentAudio, setCurrentAudio] = useState("");
  const [options, setOptions] = useState([]);
  const [status, setStatus] = useState("Enter a word and an audio link to start.");
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [childMode, setChildMode] = useState(false);
  const [history, setHistory] = useState([]);

  const audioSrc = useMemo(() => parseVocarooLink(currentAudio), [currentAudio]);
  const accuracy = rounds > 0 ? Math.round((score / rounds) * 100) : 0;

  function createRound() {
    const cleanWord = normalizeWord(wordInput);
    const cleanAudio = audioLink.trim();

    if (!cleanWord) {
      setStatus("Please type the correct word.");
      return;
    }
    if (!cleanAudio) {
      setStatus("Please paste an audio link.");
      return;
    }

    setCurrentWord(cleanWord);
    setCurrentAudio(cleanAudio);
    setOptions(buildOptions(cleanWord, language, difficulty));
    setLastAnswer(null);
    setStatus("Play the audio and choose the correct spelling.");
  }

  function answer(option) {
    if (!currentWord || options.length !== 3 || lastAnswer !== null) return;

    const isCorrect = option === currentWord;
    setRounds((value) => value + 1);

    if (isCorrect) {
      setScore((value) => value + 1);
      setLastAnswer("correct");
      setStatus(`Correct. "${currentWord}" is the right answer.`);
    } else {
      setLastAnswer("wrong");
      setStatus(`Not quite. The correct answer was "${currentWord}".`);
    }

    setHistory((items) => [
      {
        word: currentWord,
        selected: option,
        correct: isCorrect,
        language,
        difficulty,
      },
      ...items,
    ].slice(0, 10));
  }

  function clearRound() {
    setCurrentWord("");
    setCurrentAudio("");
    setOptions([]);
    setLastAnswer(null);
    setStatus("Enter a word and an audio link to start.");
  }

  function resetSession() {
    setScore(0);
    setRounds(0);
    setHistory([]);
    setLastAnswer(null);
    setStatus("Session reset. Ready for a new round.");
  }

  function ResultPill({ label, value }) {
    return (
      <div className="pill">
        <span className="pill-label">{label}</span>
        <strong>{value}</strong>
      </div>
    );
  }

  return (
    <div className={`app-shell ${childMode ? "child-shell" : ""}`}>
      {!childMode && (
        <aside className="panel parent-panel">
          <div className="panel-header">
            <h1>Spelling Audio Game</h1>
            <p>Parent setup for English and French listening-spelling rounds.</p>
          </div>

          <div className="form-group">
            <label>Language</label>
            <div className="segmented">
              <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button>
              <button className={language === "fr" ? "active" : ""} onClick={() => setLanguage("fr")}>French</button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty: {difficulty}</label>
            <input
              id="difficulty"
              type="range"
              min="1"
              max="5"
              value={difficulty}
              onChange={(event) => setDifficulty(Number(event.target.value))}
            />
            <small>1 is easier. 5 makes the distractors more subtle.</small>
          </div>

          <div className="form-group">
            <label htmlFor="word">Correct word</label>
            <input
              id="word"
              type="text"
              value={wordInput}
              onChange={(event) => setWordInput(event.target.value)}
              placeholder={language === "fr" ? "e.g. chien" : "e.g. school"}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audio">Audio link</label>
            <input
              id="audio"
              type="text"
              value={audioLink}
              onChange={(event) => setAudioLink(event.target.value)}
              placeholder="Paste a Vocaroo or direct audio link"
            />
            <small>Vocaroo links are converted automatically into a playable MP3 link.</small>
          </div>

          <div className="button-row">
            <button className="primary" onClick={createRound}>Create round</button>
            <button onClick={clearRound}>Clear round</button>
            <button onClick={resetSession}>Reset score</button>
          </div>

          <div className="button-row">
            <button className="secondary" onClick={() => setChildMode(true)}>Enter child mode</button>
          </div>

          <div className="history-box">
            <h2>Recent answers</h2>
            {history.length === 0 ? (
              <p className="muted">No answers yet.</p>
            ) : (
              <ul>
                {history.map((item, index) => (
                  <li key={`${item.word}-${index}`} className={item.correct ? "correct-row" : "wrong-row"}>
                    <span>{item.word}</span>
                    <span>{item.selected}</span>
                    <span>{item.correct ? "✓" : "✗"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}

      <main className={`panel play-panel ${childMode ? "fullscreen" : ""}`}>
        <div className="play-top">
          <div>
            <h2>{childMode ? "Choose the correct word" : "Child play screen"}</h2>
            <p>{status}</p>
          </div>
          <div className="stats-grid">
            <ResultPill label="Score" value={`${score}/${rounds}`} />
            <ResultPill label="Accuracy" value={`${accuracy}%`} />
            <ResultPill label="Language" value={language === "fr" ? "French" : "English"} />
            <ResultPill label="Level" value={difficulty} />
          </div>
        </div>

        <section className="audio-card">
          <p className="section-label">Audio</p>
          {audioSrc ? (
            <audio key={audioSrc} controls className="audio-player">
              <source src={audioSrc} type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
          ) : (
            <p className="muted">No audio loaded yet.</p>
          )}
        </section>

        <section className="options-card">
          <p className="section-label">Tap the correct spelling</p>
          <div className={`options-grid ${childMode ? "child-grid" : ""}`}>
            {options.length === 3 ? (
              options.map((option) => {
                const revealCorrect = lastAnswer !== null && option === currentWord;
                return (
                  <button
                    key={option}
                    className={`option-button ${revealCorrect ? "correct-highlight" : ""}`}
                    onClick={() => answer(option)}
                    disabled={lastAnswer !== null}
                  >
                    {option}
                  </button>
                );
              })
            ) : (
              <p className="muted">Create a round to display three options.</p>
            )}
          </div>
        </section>

        <div className="button-row">
          {childMode && <button onClick={() => setChildMode(false)}>Exit child mode</button>}
          <button className="primary" onClick={createRound}>New round</button>
        </div>
      </main>
    </div>
  );
}
