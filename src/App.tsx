import { useEffect, useState, useRef } from "react";
import long from "./assets/valkyries.mp3";
import "./App.css";
import { ChromaprintContext } from "./chromaprint/chromaprint_wasm";
import { convertF32toI16, audioRecorder } from "./audioRecorder";
import { useSpring, animated, config } from '@react-spring/web'
 

const decodeAudio = async (src: string) => {
  const audioContext = new AudioContext();
  const audioFile = await (await fetch(src)).arrayBuffer();
  const audiobuffer = await audioContext.decodeAudioData(audioFile);
  const channeldata = audiobuffer.getChannelData(0);

 return convertF32toI16(channeldata)
};

const fingerprint = async (a: string) => {
  const output = await decodeAudio(a);

  return fingerprintRaw(output)
};

const fingerprintRaw = async (output: Int16Array) => {

  const chroma = new ChromaprintContext();

  chroma.feed(output);
  const data = chroma.finish_raw();

  return data;

}
const invert = (x: Set<number>) => {
  const res = new Map<number, Set<number>>();

  x.forEach((val, idx) => {
    if (!res.has(val)) {
      res.set(val, new Set<number>());
    }

    res.get(val)?.add(idx);
  });
  return res;
};

function Compare(fprint1: Uint32Array, fprint2:Uint32Array) {
  let dist = 0;
  if (fprint1.length !== fprint2.length) {
    return 0;
  }

  for (let i = 0; i < fprint1.length; i++) {
    dist += hamming(fprint1[i], fprint2[i]);
  }

  const score = 1 - dist / (fprint1.length * 32);
  return score
}

function hamming(a: number, b: number): number {
  let dist = 0;
  for (let i = 0; i < 32; i++) {
    if ((a & (1 << i)) !== (b & (1 << i))) {
      dist++;
    }
  }
  return dist;
}

const getBestOffset = (full: Uint32Array, short: Uint32Array, duration = 0) => {
  let len = Math.floor(short.length)
  len += len % 2 === 1 ? -1 : 0;

  const iterations =  full.length - len

  const fp_subset = short.subarray(0, len)

  const output = new Array<number>(iterations).fill(0)

  let max = 0; 

  let index = -1
  for(let i =0 ; i < iterations; i++)
  {
    const fp_full = full.subarray(i, len + i)
    const current = (Compare(fp_subset, fp_full))

    if(max < current)
    {
      max = current
      index = i
    }
  }

  return (duration / full.length) * index

};



const getTest = async () => {
  const data = await (await import("./assets/test.json")).default;
  return Uint32Array.from(data);
};

const asyncAudio = async (duration:number) => {
  const start = Date.now();

  const [full] = await Promise.all([fingerprint(long)]);



  console.log(full);

  console.timeEnd("test");

  return { time: (Date.now() - start) /1000, data: JSON.stringify(Array.from(full)) };
};

function App() {
  const [count, setCount] = useState(0);
  const chroma = useRef(null);
  const [data, setData] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const [time, api] = useSpring(()=>({content: 0, config:config.stiff }))
const generate = async () => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration;

    const { data, time } = await asyncAudio(duration);
    setCount(time);
    setData(data);
  
  }

  useEffect(()=>{
    if(!audioRef.current)
    return

    audioRef.current.addEventListener("timeupdate", (e) => {
      api({content: audioRef.current?.currentTime})
    })
  }, [])

  const sync = async()=> {
    if(!audioRef.current) return
    
    audioRef.current.play()
    audioRef.current.pause()

    const duration = audioRef.current.duration

    const start = Date.now()

    const audio = await audioRecorder()

    if(!audio)
    {
      console.log("no audio")
      return
    }

    const [full, part] = await Promise.all([getTest(), fingerprintRaw(audio)]);


    const best = getBestOffset(full, part, duration)

    const time =best + (Date.now() - start)/1000

    audioRef.current.currentTime = time
    audioRef.current.play()

  }

  return (
    <div className="App">
      <h1>synch devices with audio</h1>
      <h2>1. play this audio on one device</h2>
      <audio src={long} ref={audioRef} controls/>
     <div><animated.span >{time.content.to(x=>x.toFixed(0)+"s")}</animated.span></div>
      {import.meta.env.DEV ? <h3 style={{ color: "white" }}>{count === 0 ?" calculating...": count+"s"}</h3> : null}
      {data && <div><textarea value={data} readOnly/></div>}
      {import.meta.env.DEV ? <button onClick={()=>generate()}>generate</button> : null}
      <h2>2. listen to the audio using the second device</h2>
      <div>on the first click this might sync, because i dont get the permission to use audio first</div>
      <button onClick={()=>sync()}>record</button>
     
    
    </div>
  );
}

export default App;
