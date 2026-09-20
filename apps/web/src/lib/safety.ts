import type { Alert, Medicine, Patient } from "./types";

const GENERIC: Record<string, string> = {
  acetaminophen: "paracetamol",
  tylenol: "paracetamol",
  dolo: "paracetamol",
  calpol: "paracetamol",
  "ferrous sulphate": "ferrous",
  "ferrous sulfate": "ferrous",
  "iron tablet": "ferrous",
  "calcium carbonate": "calcium",
  "calcium tablet": "calcium",
};

function norm(name: string) {
  const lower = name.trim().toLowerCase();
  return GENERIC[lower] ?? lower.split(" ")[0];
}

const INTERACTIONS: { a: string; b: string; message: string; messageTa: string }[] = [
  {
    a: "ferrous",
    b: "calcium",
    message:
      "Iron and calcium taken together reduce iron absorption. Space them at least 2 hours apart.",
    messageTa: "இரும்பும் கால்சியமும் ஒன்றாக எடுத்தால் இரும்பு சத்து குறையும். 2 மணி நேரம் இடைவெளி விடுங்கள்.",
  },
  {
    a: "amlodipine",
    b: "ibuprofen",
    message:
      "Ibuprofen can raise blood pressure and reduce the effect of amlodipine. Flag for the visiting doctor.",
    messageTa: "இபுபுருஃபன் இரத்த அழுத்தத்தை உயர்த்தலாம். மருத்துவரிடம் காட்டுங்கள்.",
  },
  {
    a: "metformin",
    b: "ibuprofen",
    message:
      "Long-term NSAID use with diabetes needs a doctor review for kidney safety. This is not a diagnosis.",
    messageTa: "நீரிழிவுடன் இபுபுருஃபன் நீண்ட நாள் பயன்படுத்தினால் சிறுநீரக பரிசோதனை தேவை.",
  },
];

const DANGER_COPY: Record<string, { en: string; ta: string }> = {
  bleeding: {
    en: "Reported vaginal bleeding is an NHM pregnancy danger sign. Arrange urgent review. This is not a diagnosis.",
    ta: "இரத்தப்போக்கு கர்ப்ப ஆபத்து அறிகுறி. உடனடி பரிசோதனை வேண்டும்.",
  },
  swelling: {
    en: "Face/hand swelling in pregnancy is on the danger-sign checklist. Flag for the ANM/doctor.",
    ta: "கர்ப்பத்தில் முகம்/கை வீக்கம் ஆபத்து பட்டியலில் உள்ளது.",
  },
  headache: {
    en: "Severe headache in pregnancy needs a clinician, especially with high BP.",
    ta: "கர்ப்பத்தில் கடும் தலைவலிக்கு மருத்துவர் தேவை.",
  },
  convulsions: {
    en: "Fits/convulsions: emergency transport. AshaLens does not treat this.",
    ta: "வலிப்பு: அவசர அனுப்புதல். இந்த ஆப் சிகிச்சை அல்ல.",
  },
  reduced_movement: {
    en: "Reduced fetal movement is a danger sign. Do not wait for the next ANC date.",
    ta: "குழந்தை அசைவு குறைவு ஆபத்து. அடுத்த ANC வரை காக்க வேண்டாம்.",
  },
};

export const DRUG_EXPLAIN: Record<string, { en: string; ta: string }> = {
  ferrous:
    {
      en: "This is an iron tablet for blood. Take after food. Do not take with milk or calcium at the same time.",
      ta: "இது இரத்தத்திற்கான இரும்பு மாத்திரை. உணவிற்கு பின் எடுங்கள். பாலுடன் எடுக்க வேண்டாம்.",
    },
  calcium: {
    en: "This is a calcium tablet for bones. Take at a different time from iron.",
    ta: "இது எலும்பிற்கான கால்சியம் மாத்திரை. இரும்பு மாத்திரையிலிருந்து வேறு நேரத்தில் எடுங்கள்.",
  },
  metformin: {
    en: "This is a diabetes tablet. Take with food. Do not skip meals.",
    ta: "இது நீரிழிவு மாத்திரை. உணவுடன் எடுங்கள். உணவை தவிர்க்க வேண்டாம்.",
  },
  amlodipine: {
    en: "This is a blood-pressure tablet. Take it every day even if you feel well.",
    ta: "இது இரத்த அழுத்த மாத்திரை. சுகமாக இருந்தாலும் தினமும் எடுங்கள்.",
  },
  paracetamol: {
    en: "This is a fever and pain tablet. Do not take two brands of the same medicine together.",
    ta: "இது காய்ச்சல் வலிக்கு. ஒரே மருந்தின் இரண்டு பிராண்டை ஒன்றாக எடுக்க வேண்டாம்.",
  },
  folic: {
    en: "This is folic acid, used in pregnancy. Take once daily as advised.",
    ta: "இது ஃபோலிக் அமிலம். கர்ப்ப காலத்தில் தினமும் எடுங்கள்.",
  },
  amoxicillin: {
    en: "This is an antibiotic. Finish the full course even if the child feels better.",
    ta: "இது ஆன்டிபயாடிக். குழந்தை சுகமாக இருந்தாலும் முழு கோர்ஸையும் முடியுங்கள்.",
  },
  ibuprofen: {
    en: "This is a pain tablet. Avoid if the doctor has warned about kidneys or ulcers.",
    ta: "இது வலி மாத்திரை. சிறுநீரகம் அல்லது வயிற்றுப் புண் இருந்தால் மருத்துவரிடம் கேளுங்கள்.",
  },
  atorvastatin: {
    en: "This is a cholesterol tablet. Usually taken at night.",
    ta: "இது கொழுப்பு மாத்திரை. பொதுவாக இரவில் எடுங்கள்.",
  },
};

export function explainDrug(name: string) {
  return DRUG_EXPLAIN[norm(name)];
}

function daysSince(date: string) {
  const then = new Date(date + "T00:00:00");
  const now = new Date("2026-09-02T00:00:00");
  return Math.round((now.getTime() - then.getTime()) / 86400000);
}

export function evaluateSafety(patient: Patient): Alert[] {
  const alerts: Alert[] = [];
  const meds = patient.medicines;

  const keys = meds.map((m) => norm(m.name));
  const seen = new Map<string, Medicine[]>();
  keys.forEach((k, i) => {
    const list = seen.get(k) ?? [];
    list.push(meds[i]);
    seen.set(k, list);
  });
  for (const [k, list] of seen) {
    if (list.length > 1) {
      alerts.push({
        id: `dup-${patient.id}-${k}`,
        severity: "high",
        kind: "duplicate",
        message: `Possible duplicate of ${k} (${list.map((m) => m.name).join(" + ")}). Confirm with the doctor before giving both.`,
        messageTa: `${k} இரண்டு முறை இருக்கலாம். இரண்டையும் கொடுக்கும் முன் மருத்துவரிடம் உறுதி செய்யுங்கள்.`,
      });
    }
  }

  for (const pair of INTERACTIONS) {
    const hasA = keys.includes(pair.a);
    const hasB = keys.includes(pair.b);
    if (hasA && hasB) {
      alerts.push({
        id: `ix-${patient.id}-${pair.a}-${pair.b}`,
        severity: "high",
        kind: "interaction",
        message: pair.message,
        messageTa: pair.messageTa,
      });
    }
  }

  const latest = patient.vitals[patient.vitals.length - 1];
  if (patient.pregnant && latest?.bpSystolic && latest.bpSystolic >= 140) {
    alerts.push({
      id: `ds-bp-${patient.id}`,
      severity: "high",
      kind: "danger_sign",
      message: `Pregnancy blood pressure ${latest.bpSystolic}/${latest.bpDiastolic} is in the danger-sign range on the NHM checklist. Arrange a doctor review today. This app does not diagnose pre-eclampsia.`,
      messageTa: `கர்ப்ப கால இரத்த அழுத்தம் ஆபத்து அறிகுறி வரம்பில் உள்ளது. இன்று மருத்துவரை அணுகுங்கள்.`,
    });
  }

  if (latest?.hemoglobin != null && latest.hemoglobin < 7) {
    alerts.push({
      id: `ds-hb-${patient.id}`,
      severity: "high",
      kind: "danger_sign",
      message: `Haemoglobin ${latest.hemoglobin} g/dL is in the severe-anaemia range used for referral checklists. Confirm with a lab and the doctor. Not a diagnosis.`,
      messageTa: `ஹீமோகுளோபின் மிகவும் குறைவு. ஆய்வகம் மற்றும் மருத்துவரிடம் உறுதி செய்யுங்கள்.`,
    });
  }

  for (const sign of patient.reportedSigns ?? []) {
    const copy = DANGER_COPY[sign];
    if (!copy) continue;
    alerts.push({
      id: `ds-${sign}-${patient.id}`,
      severity: "high",
      kind: "danger_sign",
      message: copy.en,
      messageTa: copy.ta,
    });
  }

  const dueDate = patient.nextVisit ?? patient.lastVisit;
  const overdueDays = daysSince(dueDate);
  const threshold = patient.pregnant ? 14 : 45;
  if (overdueDays >= threshold) {
    alerts.push({
      id: `od-${patient.id}`,
      severity: patient.pregnant ? "high" : "medium",
      kind: "overdue",
      message: `Follow-up is ${overdueDays} days past the planned date. Visit this household this week.`,
      messageTa: `பின்தொடர்தல் ${overdueDays} நாட்கள் தாமதம். இந்த வாரம் வீட்டிற்கு செல்லுங்கள்.`,
    });
  }

  return alerts;
}

export function followUpScore(patient: Patient) {
  const alerts = evaluateSafety(patient);
  let score = 0;
  for (const a of alerts) {
    if (a.severity === "high") score += 3;
    else if (a.severity === "medium") score += 2;
    else score += 1;
  }
  if (patient.pregnant) score += 1;
  return score;
}

export function rankPatients(patients: Patient[]) {
  return [...patients].sort((a, b) => followUpScore(b) - followUpScore(a));
}

export function patientFeatures(patient: Patient) {
  const alerts = evaluateSafety(patient);
  const latest = patient.vitals[patient.vitals.length - 1];
  const due = patient.nextVisit ?? patient.lastVisit;
  return {
    days_overdue: daysSince(due),
    pregnant: patient.pregnant ? 1 : 0,
    gestational_week: patient.gestationalWeek ?? 0,
    high_bp: latest?.bpSystolic && latest.bpSystolic >= 140 ? 1 : 0,
    duplicate_meds: alerts.some((a) => a.kind === "duplicate") ? 1 : 0,
    interaction: alerts.some((a) => a.kind === "interaction") ? 1 : 0,
    anemia: latest?.hemoglobin != null && latest.hemoglobin < 10 ? 1 : 0,
    danger_sign: alerts.some((a) => a.kind === "danger_sign") ? 1 : 0,
    age: patient.age,
  };
}

export function briefingText(patients: Patient[], who: string) {
  const ranked = rankPatients(patients).slice(0, 8);
  const lines = [
    `AshaLens doctor briefing — ${who}`,
    "Not a diagnosis. Confirm on site.",
    "",
    ...ranked.map((p, i) => {
      const alerts = evaluateSafety(p);
      return `${i + 1}. ${p.name} (${p.village}) score ${followUpScore(p)} — ${alerts.map((a) => a.kind).join(", ") || "no flags"}`;
    }),
  ];
  return lines.join("\n");
}
