import type { Alert, Patient } from "./types";
import { norm } from "./safety";
import { snomedFor } from "./snomed";

const NOTE = "Not a diagnosis. Not an eSanjeevani record.";

function medication(patient: Patient, index: number) {
  const medicine = patient.medicines.filter((item) => item.confirmed)[index];
  const generic = norm(medicine.name);
  const coded = snomedFor(generic);
  return {
    resourceType: "MedicationStatement",
    id: `med-${patient.id}-${index}`,
    status: "active",
    subject: { reference: `Patient/${patient.id}` },
    medicationCodeableConcept: coded
      ? {
          coding: [{ system: "http://snomed.info/sct", code: coded.code, display: coded.display }],
          text: `${medicine.name} ${medicine.dose}`.trim(),
        }
      : { text: `${medicine.name} ${medicine.dose}`.trim() },
    dosage: [{ text: `${medicine.dose} · ${medicine.frequency}` }],
    note: [{ text: NOTE }],
  };
}

function observations(patient: Patient) {
  const latest = patient.vitals[patient.vitals.length - 1];
  if (!latest) return [];
  const rows = [];
  if (latest.bpSystolic && latest.bpDiastolic) {
    rows.push({
      resourceType: "Observation",
      id: `bp-${patient.id}`,
      status: "final",
      code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood pressure panel" }] },
      subject: { reference: `Patient/${patient.id}` },
      effectiveDateTime: latest.date,
      component: [
        {
          code: { coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }] },
          valueQuantity: { value: latest.bpSystolic, unit: "mmHg" },
        },
        {
          code: { coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }] },
          valueQuantity: { value: latest.bpDiastolic, unit: "mmHg" },
        },
      ],
      note: [{ text: NOTE }],
    });
  }
  if (latest.hemoglobin != null) {
    rows.push({
      resourceType: "Observation",
      id: `hb-${patient.id}`,
      status: "final",
      code: { coding: [{ system: "http://loinc.org", code: "718-7", display: "Hemoglobin" }] },
      subject: { reference: `Patient/${patient.id}` },
      effectiveDateTime: latest.date,
      valueQuantity: { value: latest.hemoglobin, unit: "g/dL" },
      note: [{ text: NOTE }],
    });
  }
  if (latest.weightKg != null) {
    rows.push({
      resourceType: "Observation",
      id: `wt-${patient.id}`,
      status: "final",
      code: { coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }] },
      subject: { reference: `Patient/${patient.id}` },
      effectiveDateTime: latest.date,
      valueQuantity: { value: latest.weightKg, unit: "kg" },
      note: [{ text: NOTE }],
    });
  }
  return rows;
}

export function toFhirBundle(patient: Patient, alerts: Alert[]) {
  const confirmed = patient.medicines.filter((item) => item.confirmed);
  const resources = [
    {
      resourceType: "Patient",
      id: patient.id,
      name: [{ text: patient.name }],
      gender: patient.sex === "F" ? "female" : "male",
      address: [{ text: patient.village }],
      extension: [
        { url: "http://ashalens.demo/age-years", valueInteger: patient.age },
        { url: "http://ashalens.demo/pregnant", valueBoolean: Boolean(patient.pregnant) },
        ...(patient.gestationalWeek
          ? [{ url: "http://ashalens.demo/gestational-week", valueInteger: patient.gestationalWeek }]
          : []),
      ],
      identifier: patient.abhaId
        ? [
            {
              system: "https://healthid.ndhm.gov.in",
              value: patient.abhaId,
              type: { text: "ABHA not checked with ABDM" },
            },
          ]
        : [],
    },
    ...confirmed.map((_, index) => medication(patient, index)),
    ...observations(patient),
    ...alerts.map((alert, index) => ({
      resourceType: "Flag",
      id: `flag-${patient.id}-${index}`,
      status: "active",
      code: { text: alert.message },
      subject: { reference: `Patient/${patient.id}` },
    })),
  ];
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    meta: { tag: [{ code: "local-export", display: NOTE }] },
    entry: resources.map((resource) => ({ resource })),
  };
}
