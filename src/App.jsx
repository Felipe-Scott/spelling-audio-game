import React, { useState } from "react";

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function mutate(word) {
  if (word.length < 3) return word;
  let i = Math.floor(Math.random() * (word.length - 1));
  return word.slice(0, i) + word[i+1] + word[i] + word.slice(i+2);
}

function buildOptions(word) {
  let wrong1 = mutate(word);
  let wrong2 = mutate(word);
  return shuffle([word, wrong1, wrong2]);
}

function vocarooToMp3(url) {
  const id = url.split("/").pop();
  return `https://media.vocaroo.com/mp3/${id}`;
}

export default function App() {
  const [word, setWord] = useState("");
  const [audio, setAudio] = useState("");
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  function start() {
    setOptions(buildOptions(word));
  }

  function answer(opt) {
    setTotal(total + 1);
    if (opt === word) {
      setScore(score + 1);
      alert("Correct!");
    } else {
      alert("Wrong!");
    }
  }

  return (
    <div style={{padding: 20}}>
      <h2>Spelling Audio Game</h2>

      <input placeholder="word" value={word} onChange={e=>setWord(e.target.value)} />
      <input placeholder="vocaroo link" value={audio} onChange={e=>setAudio(e.target.value)} />

      <button onClick={start}>Start</button>

      <div>
        <audio controls src={vocarooToMp3(audio)} />
      </div>

      <div>
        {options.map((o,i)=>(
          <button key={i} onClick={()=>answer(o)}>{o}</button>
        ))}
      </div>

      <p>Score: {score}/{total}</p>
    </div>
  );
}
