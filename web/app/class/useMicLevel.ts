"use client";

import { useEffect, useState } from "react";
import { classifyLevel, rms, smoothLevel, type MicLevel } from "./micLevel";

const SAMPLE_EVERY_MS = 250;

/** Live loudness of the class microphone (null when no stream). Reads the same stream as the recorder. */
export function useMicLevel(stream: MediaStream | null): MicLevel | null {
  const [level, setLevel] = useState<MicLevel | null>(null);

  useEffect(() => {
    if (!stream) return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let smoothed = 0;
    const timer = setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      smoothed = smoothLevel(smoothed, rms(samples));
      setLevel(classifyLevel(smoothed));
    }, SAMPLE_EVERY_MS);
    return () => {
      clearInterval(timer);
      source.disconnect();
      void context.close();
    };
  }, [stream]);

  return stream ? level : null;
}
