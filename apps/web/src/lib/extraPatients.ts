import type { Patient } from "./types";

function med(id: string, name: string, dose: string, frequency: string) {
  return { id, name, dose, frequency, confirmed: true };
}

const NAMES: Array<[string, string, "F" | "M"]> = [
  ["Arul", "அருள்", "M"],
  ["Bhavani", "பவானி", "F"],
  ["Chitra", "சித்ரா", "F"],
  ["Dinesh", "தினேஷ்", "M"],
  ["Eswari", "ஈஸ்வரி", "F"],
  ["Farook", "ஃபாரூக்", "M"],
  ["Gowri", "கௌரி", "F"],
  ["Hari", "ஹரி", "M"],
  ["Indira", "இந்திரா", "F"],
  ["Jeyaraj", "ஜெயராஜ்", "M"],
  ["Kalpana", "கல்பனா", "F"],
  ["Logan", "லோகன்", "M"],
  ["Malar", "மலர்", "F"],
  ["Naveen", "நவீன்", "M"],
  ["Oviya", "ஓவியா", "F"],
  ["Pandian", "பாண்டியன்", "M"],
  ["Revathi", "ரேவதி", "F"],
  ["Senthil", "செந்தில்", "M"],
  ["Thulasi", "துளசி", "F"],
  ["Usha", "உஷா", "F"],
  ["Vasanth", "வசந்த்", "M"],
  ["Yasmin", "யாஸ்மின்", "F"],
  ["Zahir", "ஜாஹிர்", "M"],
  ["Amudha", "அமுதா", "F"],
  ["Bala", "பாலா", "M"],
  ["Deepa", "தீபா", "F"],
  ["Ezhil", "எழில்", "M"],
  ["Fathima", "பாத்திமா", "F"],
  ["Gopal", "கோபால்", "M"],
  ["Helen", "ஹெலன்", "F"],
];

const ASHAS = ["asha-meena", "asha-thenmozhi", "asha-karpagam"] as const;
const VILLAGE: Record<(typeof ASHAS)[number], string> = {
  "asha-meena": "Keelamalligai",
  "asha-thenmozhi": "Chinna Odai",
  "asha-karpagam": "Mettu Street",
};

const POOLS = [
  [med("ex-m1", "Metformin", "500 mg", "twice daily")],
  [med("ex-m2", "Amlodipine", "5 mg", "once daily")],
  [med("ex-m3", "Ferrous sulphate", "200 mg", "once daily"), med("ex-m4", "Folic acid", "5 mg", "once daily")],
  [med("ex-m5", "Paracetamol", "500 mg", "as needed")],
  [],
];

export function extraPatients(): Patient[] {
  return NAMES.map(([name, nameTa, sex], i) => {
    const ashaId = ASHAS[i % 3];
    const pregnant = sex === "F" && i % 7 === 0;
    const last = `2026-0${(i % 4) + 5}-${String((i % 27) + 1).padStart(2, "0")}`;
    return {
      id: `p-extra-${i + 1}`,
      name,
      nameTa,
      age: 4 + ((i * 7) % 70),
      sex,
      village: VILLAGE[ashaId],
      ashaId,
      pregnant,
      gestationalWeek: pregnant ? 12 + (i % 20) : undefined,
      lastVisit: last,
      nextVisit: i % 5 === 0 ? "2026-07-01" : "2026-09-20",
      medicines: POOLS[i % POOLS.length].map((m, j) => ({ ...m, id: `ex-${i}-${j}` })),
      vitals: [
        {
          date: last,
          bpSystolic: 110 + (i % 40),
          bpDiastolic: 70 + (i % 20),
          hemoglobin: pregnant ? 9 + (i % 3) * 0.4 : undefined,
          weightKg: 18 + (i % 50),
        },
      ],
      documents: [],
      reportedSigns: i % 11 === 0 && pregnant ? ["swelling"] : [],
    };
  });
}
