import type { AllergyRecord, HealthRecordItem, Medicine, Patient } from "./types";
import { norm } from "./safety";

export const DEMO_HOUSEHOLD = [
  { id: "p-lakshmi", roleEn: "ANC", roleTa: "கர்ப்பம்" },
  { id: "p-anbu", roleEn: "Child", roleTa: "குழந்தை" },
  { id: "p-murugan", roleEn: "BP / diabetes", roleTa: "இரத்த அழுத்தம்" },
];

const PENICILLIN: AllergyRecord = {
  id: "alg-penicillin",
  allergen: "Penicillin",
  mappedSalts: ["penicillin", "amoxicillin", "ampicillin"],
  category: "drug",
  severity: "high",
  reactionEn: "Skin rash and breathing difficulty",
  reactionTamil: "தோல் அரிப்பு மற்றும் மூச்சுத் திணறல்",
};

const SULFA: AllergyRecord = {
  id: "alg-sulfa",
  allergen: "Sulfa drugs",
  mappedSalts: ["sulfamethoxazole"],
  category: "drug",
  severity: "moderate",
  reactionEn: "Skin rash",
  reactionTamil: "தோல் தடிப்பு",
};

const LAKSHMI_RECORDS: HealthRecordItem[] = [
  {
    id: "rec-lakshmi-jun",
    date: "2026-06-22",
    docType: "lab_slip",
    facility: "Malligai PHC",
    confirmedEntities: { vitals: { hb: 10.2, bpSystolic: 118, bpDiastolic: 76, weightKg: 54 } },
    safetyFlags: [],
    tamilSummary: "ஹீமோகுளோபின் 10.2. இரத்த அழுத்தம் 118/76.",
    verifiedByHuman: true,
  },
  {
    id: "rec-lakshmi-jul",
    date: "2026-07-20",
    docType: "prescription",
    facility: "Dr. Kumar",
    confirmedEntities: {
      drugs: [
        { name: "Ferrous sulphate", dose: "200 mg", schedule: "morning" },
        { name: "Calcium carbonate", dose: "500 mg", schedule: "afternoon" },
        { name: "Folic acid", dose: "5 mg", schedule: "night" },
      ],
      vitals: { hb: 9.6, bpSystolic: 138, bpDiastolic: 88 },
    },
    safetyFlags: ["Take iron and calcium at least 2 hours apart."],
    tamilSummary: "இரும்பு, கால்சியம், ஃபோலிக் அமிலம். இரும்பும் கால்சியமும் 2 மணி நேரம் இடைவெளி.",
    verifiedByHuman: true,
  },
  {
    id: "rec-lakshmi-aug",
    date: "2026-08-18",
    docType: "mcp_card",
    facility: "ANM sub-centre",
    confirmedEntities: { vitals: { hb: 9.1, bpSystolic: 148, bpDiastolic: 94, weightKg: 57 } },
    safetyFlags: ["Blood pressure 148/94 is on the pregnancy checklist."],
    tamilSummary: "ANC பதிவு. இரத்த அழுத்தம் 148/94. ஹீமோகுளோபின் 9.1. ஆஷா மீனா உறுதி.",
    verifiedByHuman: true,
  },
];

export const VAULT_DEFAULTS: Record<
  string,
  Pick<Patient, "bloodGroup" | "householdId" | "allergies" | "vaultRecords">
> = {
  "p-lakshmi": {
    bloodGroup: "O+",
    householdId: "hh-malligai-1",
    allergies: [PENICILLIN, SULFA],
    vaultRecords: LAKSHMI_RECORDS,
  },
  "p-anbu": {
    householdId: "hh-malligai-1",
    allergies: [PENICILLIN],
    vaultRecords: [],
  },
  "p-murugan": {
    householdId: "hh-malligai-1",
    vaultRecords: [],
  },
};

export type SlotId = "morning" | "afternoon" | "night";

export function slotFor(med: Medicine, index: number): SlotId {
  const salt = norm(med.name);
  const freq = med.frequency.toLowerCase();
  if (salt === "ferrous") return "morning";
  if (salt === "calcium") return "afternoon";
  if (salt === "folic") return "night";
  if (freq.includes("night")) return "night";
  if (freq.includes("twice")) return index % 2 === 0 ? "morning" : "night";
  if (freq.includes("three")) return (["morning", "afternoon", "night"] as const)[index % 3];
  return (["morning", "afternoon", "night"] as const)[index % 3];
}

export function recordsFor(patient: Patient): HealthRecordItem[] {
  const captured: HealthRecordItem[] = patient.documents.map((doc) => ({
    id: doc.id,
    date: doc.capturedAt.slice(0, 10),
    docType: doc.type === "other" ? "prescription" : doc.type,
    facility: "This phone",
    imageUrl: doc.dataUrl,
    confirmedEntities: {},
    safetyFlags: [],
    tamilSummary: doc.note || "புகைப்படம் இந்த தொலைபேசியில் சேமிக்கப்பட்டது.",
    verifiedByHuman: true,
  }));
  return [...(patient.vaultRecords ?? []), ...captured].sort((a, b) => b.date.localeCompare(a.date));
}

export function scheduleSpeech(patient: Patient): string {
  const meds = patient.medicines.filter((med) => med.confirmed);
  if (!meds.length) return "உறுதி செய்யப்பட்ட மாத்திரை இல்லை. மருத்துவரிடம் கேளுங்கள்.";
  const lines = meds.map((med) => `${med.name}, ${med.dose}, ${med.frequency}.`);
  return `இன்றைய மாத்திரைகள். ${lines.join(" ")} அவசரமாக இருந்தால் 108 ஐ அழையுங்கள்.`;
}
