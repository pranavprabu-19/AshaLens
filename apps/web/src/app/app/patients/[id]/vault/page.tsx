"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "@/lib/store";
import { patchPatient } from "@/lib/storage";
import { checkAllergyConflict, norm } from "@/lib/safety";
import { speakTamil } from "@/lib/mlApi";
import { ASHAS } from "@/lib/seed";
import { DEMO_HOUSEHOLD, recordsFor, scheduleSpeech, slotFor, type SlotId } from "@/lib/vault";
import type { HealthRecordItem, Patient } from "@/lib/types";

const TABS = [
  { id: "meds", en: "Medicines", ta: "மாத்திரை" },
  { id: "profile", en: "Allergies", ta: "ஒவ்வாமை" },
  { id: "records", en: "Records", ta: "பதிவு" },
  { id: "care", en: "Care", ta: "உதவி" },
] as const;

const SLOTS: { id: SlotId; en: string; ta: string }[] = [
  { id: "morning", en: "Morning", ta: "காலை" },
  { id: "afternoon", en: "Afternoon", ta: "மதியம்" },
  { id: "night", en: "Night", ta: "இரவு" },
];

type TabId = (typeof TABS)[number]["id"];
type Lang = "en" | "ta";

function text(lang: Lang, en: string, ta: string) {
  return lang === "ta" ? ta : en;
}

async function listen(spoken: string) {
  try {
    const result = await speakTamil(spoken);
    if (result.audio_url) {
      await new Audio(result.audio_url).play();
      return;
    }
  } catch {
    /* The browser voice still reads the same confirmed line. */
  }
  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.lang = "ta-IN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function VaultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { patients, refresh } = useStore();
  const patient = patients.find((item) => item.id === id);
  const [lang, setLang] = useState<Lang>("ta");
  const [tab, setTab] = useState<TabId>("meds");
  const [familyOpen, setFamilyOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | HealthRecordItem["docType"]>("all");
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [allergen, setAllergen] = useState("");

  if (!patient) return <p className="p-4 text-sm">Patient not on this roster.</p>;
  const record = patient;
  const latest = record.vitals[record.vitals.length - 1];
  const highBp = Boolean(latest?.bpSystolic && latest.bpSystolic >= 140);
  const lowHb = latest?.hemoglobin != null && latest.hemoglobin < 7;
  const asha = ASHAS.find((item) => item.id === record.ashaId);
  const members = DEMO_HOUSEHOLD.map((member) => ({
    ...member,
    patient: patients.find((item) => item.id === member.id),
  })).filter((member) => member.patient);
  const confirmed = record.medicines.filter((med) => med.confirmed);
  const conflicts = checkAllergyConflict(
    confirmed.map((med) => med.name),
    record.allergies ?? [],
  );
  const records = recordsFor(record);
  const shown = records.filter((item) => filter === "all" || item.docType === filter);
  const selected = records.find((item) => item.id === openRecord);
  const helpline = process.env.NEXT_PUBLIC_HELPLINE_NUMBER;
  const sharing = Boolean(record.shareUntil && new Date(record.shareUntil).getTime() > Date.now());
  const qrValue = JSON.stringify({
    name: record.name,
    bloodGroup: record.bloodGroup ?? "",
    allergies: (record.allergies ?? []).map((item) => item.allergen),
    medicines: confirmed.map((med) => `${med.name} ${med.dose}`),
  });

  function addAllergy(event: FormEvent) {
    event.preventDefault();
    const name = allergen.trim();
    if (!name) return;
    patchPatient(record.id, {
      allergies: [
        ...(record.allergies ?? []),
        {
          id: `alg-${Date.now()}`,
          allergen: name,
          mappedSalts: [norm(name)],
          category: "drug",
          severity: "high",
          reactionEn: "Confirm the reaction with the doctor.",
          reactionTamil: "விவரத்தை மருத்துவரிடம் உறுதி செய்யுங்கள்.",
        },
      ],
    });
    setAllergen("");
    refresh();
  }

  function toggleShare() {
    patchPatient(record.id, {
      shareUntil: sharing ? "" : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    refresh();
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-20 shrink-0 border-b border-sand bg-white px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-xl leading-tight text-teal-dark">
              {record.name}, {record.age}
            </p>
            <p className="truncate text-[11px] text-ink/60">
              {record.village}
              {record.abhaId ? ` · ABHA ${record.abhaId}` : ` · ${text(lang, "ABHA not verified", "ABHA சரிபார்க்கப்படவில்லை")}`}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setFamilyOpen((open) => !open)}
              className="rounded-full bg-sand px-2 py-1 text-[11px] font-semibold text-teal-dark"
            >
              {text(lang, `Family (${members.length})`, `குடும்பம் (${members.length})`)}
            </button>
            <button
              type="button"
              onClick={() => setLang((value) => (value === "ta" ? "en" : "ta"))}
              className="rounded-full bg-teal px-2 py-1 text-[11px] font-semibold text-cream"
            >
              {lang === "ta" ? "EN" : "தமிழ்"}
            </button>
          </div>
        </div>
        <div className="mt-1 flex gap-1 overflow-hidden">
          {(record.allergies ?? []).length === 0 ? (
            <span className="rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-semibold text-ok">
              {text(lang, "No known allergies", "தெரிந்த ஒவ்வாமை இல்லை")}
            </span>
          ) : (
            record.allergies?.map((item) => (
              <span
                key={item.id}
                className={`truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  item.severity === "high" ? "bg-alert/15 text-alert" : "bg-warn/15 text-warn"
                }`}
              >
                {item.allergen}
              </span>
            ))
          )}
        </div>
        <p className="mt-1 truncate text-[11px] font-medium">
          {record.pregnant ? `${text(lang, "ANC", "கர்ப்பம்")} ${record.gestationalWeek ?? "—"} · ` : ""}
          {record.bloodGroup ? `${record.bloodGroup} · ` : ""}
          {highBp ? <span className="text-warn">BP {latest?.bpSystolic}/{latest?.bpDiastolic}</span> : null}
          {lowHb ? <span className="text-alert"> Hb {latest?.hemoglobin}</span> : null}
          {!highBp && latest?.bpSystolic ? <span>BP {latest.bpSystolic}/{latest.bpDiastolic}</span> : null}
          {!lowHb && latest?.hemoglobin != null ? <span> · Hb {latest.hemoglobin}</span> : null}
        </p>
        {familyOpen ? (
          <ul className="absolute right-3 top-12 z-20 w-48 rounded-2xl border border-sand bg-white p-1 shadow-card">
            {members.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  className="block w-full rounded-xl px-2 py-2 text-left text-sm"
                  onClick={() => {
                    setFamilyOpen(false);
                    setOpenRecord(null);
                    router.push(`/app/patients/${member.id}/vault`);
                  }}
                >
                  {member.patient?.name} · {text(lang, member.roleEn, member.roleTa)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <section className="min-h-0 flex-1 overflow-hidden px-3 py-2">
        {tab === "meds" ? (
          <Medicines
            lang={lang}
            patient={record}
            conflicts={conflicts.map((item) => item.message)}
            onListen={() => listen(scheduleSpeech(record))}
          />
        ) : null}
        {tab === "profile" ? (
          <div className="flex h-full flex-col gap-2 overflow-hidden text-sm">
            <ul className="min-h-0 space-y-1 overflow-hidden">
              {(record.allergies ?? []).map((item) => (
                <li key={item.id} className="rounded-2xl bg-white px-3 py-2">
                  <p className="font-semibold">
                    {item.allergen} · {item.severity === "high" ? text(lang, "High", "அதிகம்") : text(lang, "Moderate", "மிதமான")}
                  </p>
                  <p className="text-xs text-ink/70">{text(lang, item.reactionEn, item.reactionTamil)}</p>
                </li>
              ))}
            </ul>
            <form onSubmit={addAllergy} className="flex gap-2">
              <input
                value={allergen}
                onChange={(event) => setAllergen(event.target.value)}
                placeholder={text(lang, "Add allergy", "ஒவ்வாமை சேர்")}
                className="min-w-0 flex-1 rounded-2xl border border-sand bg-white px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-2xl bg-teal px-3 text-sm font-semibold text-cream">
                {text(lang, "Add", "சேர்")}
              </button>
            </form>
            <div className="rounded-2xl bg-white px-3 py-2 text-xs leading-relaxed">
              {record.pregnant ? (
                <p>
                  {text(lang, `Pregnancy, week ${record.gestationalWeek ?? "—"}.`, `கர்ப்பம், வாரம் ${record.gestationalWeek ?? "—"}.`)}
                </p>
              ) : (
                <p>{text(lang, "No pregnancy record on this chart.", "இந்த பதிவில் கர்ப்பம் இல்லை.")}</p>
              )}
              {latest?.hemoglobin != null && latest.hemoglobin < 11 ? (
                <p>
                  {text(
                    lang,
                    `Haemoglobin ${latest.hemoglobin} g/dL is on the chart.`,
                    `ஹீமோகுளோபின் ${latest.hemoglobin}. பதிவில் உள்ள எண்.`,
                  )}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        {tab === "records" ? (
          <div className="flex h-full flex-col gap-2 overflow-hidden">
            <div className="flex gap-1 overflow-x-auto">
              {(
                [
                  ["all", text(lang, "All", "அனைத்தும்")],
                  ["prescription", text(lang, "Prescriptions", "மருந்து")],
                  ["lab_slip", text(lang, "Labs", "ஆய்வு")],
                  ["mcp_card", text(lang, "MCP", "MCP")],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                    filter === id ? "bg-teal text-cream" : "bg-white text-ink"
                  }`}
                >
                  {label} ({id === "all" ? records.length : records.filter((item) => item.docType === id).length})
                </button>
              ))}
            </div>
            <p className="truncate text-[11px] text-ink/70">{trend(record, lang)}</p>
            {selected ? (
              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-white p-3 text-sm">
                <button type="button" className="text-xs font-semibold text-teal" onClick={() => setOpenRecord(null)}>
                  {text(lang, "Back", "பின்")}
                </button>
                <p className="mt-1 font-semibold">
                  {selected.date} · {selected.facility}
                </p>
                <p className="text-xs">{text(lang, selected.safetyFlags.join(" ") || "Confirmed summary.", selected.tamilSummary)}</p>
                {selected.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.imageUrl} alt="" className="mt-2 max-h-40 w-full rounded-xl object-cover" />
                ) : (
                  <p className="mt-2 text-xs text-ink/60">
                    {text(lang, "Paper photo is not stored on this phone.", "காகித புகைப்படம் இந்த தொலைபேசியில் இல்லை.")}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto">
                {shown.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOpenRecord(item.id)}
                    className="w-44 shrink-0 rounded-2xl bg-white p-3 text-left text-xs"
                  >
                    <p className="font-semibold">{item.date}</p>
                    <p>{item.facility}</p>
                    <p className="mt-1 text-ink/70">{item.docType.replace("_", " ")}</p>
                    <p className="mt-1 line-clamp-3">{item.tamilSummary}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {tab === "care" ? (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
            <a href="tel:9000011000" className="rounded-2xl bg-white p-3 text-sm font-semibold">
              {text(lang, `Call ASHA ${asha?.name ?? "worker"}`, `ஆஷா ${asha?.name ?? ""} அழை`)}
              <span className="mt-1 block text-[11px] font-normal text-ink/60">9000011000</span>
            </a>
            {helpline ? (
              <a href={`tel:${helpline}`} className="rounded-2xl bg-white p-3 text-sm font-semibold">
                {text(lang, "Patient helpline", "நோயாளி உதவி")}
                <span className="mt-1 block text-[11px] font-normal text-ink/60">
                  {text(lang, "1 medicines, 2 alerts", "1 மாத்திரை, 2 எச்சரிக்கை")}
                </span>
              </a>
            ) : (
              <Link href="/app/dialpad" className="rounded-2xl bg-white p-3 text-sm font-semibold">
                {text(lang, "Test the helpline pad", "உதவி பலகை")}
                <span className="mt-1 block text-[11px] font-normal text-ink/60">
                  {text(lang, "1 medicines, 2 alerts", "1 மாத்திரை, 2 எச்சரிக்கை")}
                </span>
              </Link>
            )}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(scheduleSpeech(record))}`}
              className="rounded-2xl bg-white p-3 text-sm font-semibold"
            >
              {text(lang, "WhatsApp Tamil card", "வாட்ஸ்அப் தமிழ்")}
              <span className="mt-1 block text-[11px] font-normal text-ink/60">
                {text(lang, "Text summary of confirmed medicines", "உறுதி செய்யப்பட்ட மாத்திரை சுருக்கம்")}
              </span>
            </a>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-2">
              <QRCodeSVG value={qrValue} size={88} />
              <button type="button" onClick={toggleShare} className="mt-1 text-center text-[10px] font-semibold text-teal">
                {sharing
                  ? text(lang, "Shared with the PHC doctor for 24 hours. Demo only.", "24 மணி நேரம் பகிர்வு. செயல்முறை மட்டும்.")
                  : text(lang, "Share with the PHC doctor for 24 hours. Demo, not ABDM.", "24 மணி பகிர்வு. ABDM அல்ல.")}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <nav className="grid shrink-0 grid-cols-4 border-t border-sand bg-cream px-1 py-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-2xl px-1 py-2 text-[11px] font-semibold ${
              tab === item.id ? "bg-teal text-cream" : "text-ink/70"
            }`}
          >
            {text(lang, item.en, item.ta)}
          </button>
        ))}
      </nav>
    </div>
  );
}

function trend(patient: Patient, lang: Lang) {
  const vitals = [...patient.vitals].sort((a, b) => a.date.localeCompare(b.date));
  const hb = vitals.filter((item) => item.hemoglobin != null).map((item) => item.hemoglobin);
  const bp = vitals
    .filter((item) => item.bpSystolic && item.bpDiastolic)
    .map((item) => `${item.bpSystolic}/${item.bpDiastolic}`);
  const hbLine = hb.length ? `Hb ${hb.join(" → ")}` : "";
  const bpLine = bp.length ? `BP ${bp.join(" → ")}` : "";
  const line = [hbLine, bpLine].filter(Boolean).join(" · ");
  if (!line) return text(lang, "No vitals on this chart.", "பரிசோதனை எண் இல்லை.");
  return line;
}

function Medicines({
  lang,
  patient,
  conflicts,
  onListen,
}: {
  lang: Lang;
  patient: Patient;
  conflicts: string[];
  onListen: () => void;
}) {
  const confirmed = patient.medicines.filter((med) => med.confirmed);
  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      <button type="button" onClick={onListen} className="rounded-2xl bg-teal px-3 py-2 text-sm font-semibold text-cream">
        {text(lang, "Hear today's confirmed medicines", "இன்றைய மாத்திரை விவரம் கேளுங்கள்")}
      </button>
      {conflicts.length ? (
        <p className="rounded-2xl bg-alert/10 px-3 py-1 text-[11px] font-semibold text-alert">{conflicts[0]}</p>
      ) : null}
      <div className="grid min-h-0 flex-1 grid-rows-3 gap-2">
        {SLOTS.map((slot) => {
          const meds = confirmed.filter((med, index) => slotFor(med, index) === slot.id);
          return (
            <div key={slot.id} className="overflow-hidden rounded-2xl bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-teal">{text(lang, slot.en, slot.ta)}</p>
              {meds.length === 0 ? (
                <p className="text-xs text-ink/50">{text(lang, "None confirmed", "உறுதி இல்லை")}</p>
              ) : (
                meds.map((med) => {
                  const hit = checkAllergyConflict([med.name], patient.allergies ?? []);
                  const gap = norm(med.name) === "calcium";
                  return (
                    <p key={med.id} className="truncate text-sm">
                      {med.name} {med.dose}
                      {hit.length ? " · " + text(lang, "Allergy conflict", "ஒவ்வாமை") : ""}
                      {gap ? " · " + text(lang, "2 hours after iron", "இரும்புக்கு 2 மணி கழித்து") : ""}
                    </p>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
      <p className="truncate rounded-full bg-sand px-3 py-1 text-center text-[11px] font-semibold text-teal-dark">
        {patient.nextVisit
          ? text(lang, `Next visit ${patient.nextVisit}`, `அடுத்த வருகை ${patient.nextVisit}`)
          : text(lang, "No next visit on the chart", "அடுத்த வருகை இல்லை")}
      </p>
    </div>
  );
}
