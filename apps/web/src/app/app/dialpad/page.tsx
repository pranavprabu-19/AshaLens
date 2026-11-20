"use client";

import { useEffect, useState } from "react";
import { useTour } from "@/lib/tour";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

type Insight = {
  spoken_text?: string;
  audio_url?: string | null;
  audio_error?: string | null;
};

export default function DialPadPage() {
  const { step, markReady } = useTour();
  const [code, setCode] = useState("1001");
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [patientId, setPatientId] = useState("");
  const [lang, setLang] = useState<"ta" | "en">("ta");
  const [message, setMessage] = useState("Enter a short code and the 4 digit PIN. Demo PIN is 1234.");
  const [last, setLast] = useState("");

  async function login() {
    const res = await fetch("/ml/dialpad/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_short_code: code, pin }),
    });
    if (!res.ok) {
      setMessage("That code or PIN did not match.");
      return;
    }
    const body = await res.json();
    setToken(body.token);
    setPatientId(body.patient_id);
    setLang(body.preferred_lang === "en" ? "en" : "ta");
    setMessage(`${body.name}. Press 1 for today's medicines.`);
  }

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "ta" ? "ta-IN" : "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  async function play(text: string, audioUrl?: string | null) {
    setLast(text);
    setMessage(text);
    if (audioUrl) {
      try {
        await new Audio(audioUrl).play();
        return;
      } catch {
        speak(text);
        return;
      }
    }
    speak(text);
  }

  useEffect(() => {
    if (step?.id !== "dialpad") return;
    let cancel = false;
    void (async () => {
      setCode("1001");
      setPin("1234");
      try {
        const res = await fetch("/ml/dialpad/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patient_short_code: "1001", pin: "1234" }),
        });
        if (!res.ok || cancel) return;
        const body = await res.json();
        setToken(body.token);
        setPatientId(body.patient_id);
        setLang("ta");
        const insight = await fetch(`/ml/dialpad/insights/${body.patient_id}?menu=1&lang=ta`, {
          headers: { Authorization: `Bearer ${body.token}` },
        });
        if (!insight.ok || cancel) return;
        const data = (await insight.json()) as Insight;
        const text = data.spoken_text || "";
        setLast(text);
        setMessage(text);
      } finally {
        if (!cancel) markReady();
      }
    })();
    return () => {
      cancel = true;
    };
  }, [step?.id, markReady]);

  async function press(key: string) {
    if (!token) {
      if (key === "#") {
        await login();
        return;
      }
      if (key === "*") setPin("");
      else if (pin.length < 4) setPin((value) => value + key);
      return;
    }
    if (key === "*") {
      await play(last || message);
      return;
    }
    if (key === "0") {
      const next = lang === "ta" ? "en" : "ta";
      setLang(next);
      await play(next === "ta" ? "தமிழ்." : "English.");
      return;
    }
    if (!["1", "2", "3", "4", "5", "9"].includes(key)) return;
    const res = await fetch(`/ml/dialpad/insights/${patientId}?menu=${key}&lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setMessage("The session expired. Enter the PIN again.");
      setToken("");
      return;
    }
    const body = (await res.json()) as Insight;
    await play(body.spoken_text || "", body.audio_url);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl text-teal-dark">Patient dial pad</h1>
        <p className="text-sm text-ink/65">Confirmed medicines only. This is not a diagnosis.</p>
      </div>
      <label className="block text-sm">
        Short code
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-sand px-3 py-3 text-lg"
        />
      </label>
      <p className="rounded-3xl bg-white p-4 text-sm shadow-card">{message}</p>
      <p className="text-center font-display text-3xl tracking-[0.4em] text-teal-dark">{token ? "••••" : pin.padEnd(4, "·")}</p>
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => void press(key)}
            className="rounded-3xl bg-teal-dark py-5 font-display text-2xl text-cream"
          >
            {key}
          </button>
        ))}
      </div>
      {!token ? (
        <button type="button" onClick={() => void login()} className="w-full rounded-3xl bg-teal py-3 font-semibold text-cream">
          Open with PIN
        </button>
      ) : null}
    </div>
  );
}
