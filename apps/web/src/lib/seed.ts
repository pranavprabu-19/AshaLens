import { extraPatients } from "./extraPatients";
import type { Asha, Patient } from "./types";

export const PHC_NAME = "Malligai Primary Health Centre";
export const PHC_BLOCK = "Theni district (synthetic demo)";

export const ASHAS: Asha[] = [
  { id: "asha-meena", name: "Meena", village: "Keelamalligai" },
  { id: "asha-thenmozhi", name: "Thenmozhi", village: "Chinna Odai" },
  { id: "asha-karpagam", name: "Karpagam", village: "Mettu Street" },
];

export const DEMO_LOGIN = {
  asha: { email: "meena@ashalens.demo", password: "demo123", name: "Meena", ashaId: "asha-meena" },
  doctor: { email: "kumar@ashalens.demo", password: "demo123", name: "Dr. Kumar", ashaId: undefined },
};

function med(id: string, name: string, dose: string, frequency: string) {
  return { id, name, dose, frequency, confirmed: true };
}

const CORE_PATIENTS: Patient[] = [
  {
    id: "p-lakshmi",
    name: "Lakshmi",
    nameTa: "லட்சுமி",
    age: 24,
    sex: "F",
    village: "Keelamalligai",
    phone: "90000 11101",
    ashaId: "asha-meena",
    pregnant: true,
    gestationalWeek: 28,
    lastVisit: "2026-07-20",
    nextVisit: "2026-08-10",
    medicines: [
      med("m1", "Ferrous sulphate", "200 mg", "once daily"),
      med("m2", "Calcium carbonate", "500 mg", "once daily"),
      med("m3", "Folic acid", "5 mg", "once daily"),
    ],
    vitals: [
      { date: "2026-06-22", bpSystolic: 118, bpDiastolic: 76, weightKg: 54, hemoglobin: 10.2 },
      { date: "2026-07-20", bpSystolic: 138, bpDiastolic: 88, weightKg: 56, hemoglobin: 9.6 },
      { date: "2026-08-18", bpSystolic: 148, bpDiastolic: 94, weightKg: 57, hemoglobin: 9.1 },
    ],
    documents: [],
  },
  {
    id: "p-murugan",
    name: "Murugan",
    nameTa: "முருகன்",
    age: 58,
    sex: "M",
    village: "Keelamalligai",
    ashaId: "asha-meena",
    lastVisit: "2026-08-02",
    nextVisit: "2026-09-02",
    medicines: [
      med("m4", "Metformin", "500 mg", "twice daily"),
      med("m5", "Amlodipine", "5 mg", "once daily"),
      med("m6", "Ibuprofen", "400 mg", "as needed"),
    ],
    vitals: [
      { date: "2026-07-01", bpSystolic: 150, bpDiastolic: 92, weightKg: 71 },
      { date: "2026-08-02", bpSystolic: 142, bpDiastolic: 88, weightKg: 70 },
    ],
    documents: [],
  },
  {
    id: "p-selvi",
    name: "Selvi",
    nameTa: "செல்வி",
    age: 32,
    sex: "F",
    village: "Keelamalligai",
    ashaId: "asha-meena",
    lastVisit: "2026-08-12",
    medicines: [
      med("m7", "Ferrous sulphate", "200 mg", "once daily"),
      med("m8", "Calcium carbonate", "500 mg", "once daily"),
    ],
    vitals: [{ date: "2026-08-12", hemoglobin: 8.4, weightKg: 49 }],
    documents: [],
  },
  {
    id: "p-karthik",
    name: "Karthik",
    nameTa: "கார்த்திக்",
    age: 45,
    sex: "M",
    village: "Keelamalligai",
    ashaId: "asha-meena",
    lastVisit: "2026-08-28",
    medicines: [
      med("m9", "Paracetamol", "500 mg", "three times daily"),
      med("m10", "Acetaminophen", "650 mg", "twice daily"),
    ],
    vitals: [{ date: "2026-08-28", bpSystolic: 128, bpDiastolic: 80 }],
    documents: [],
  },
  {
    id: "p-divya",
    name: "Baby Divya",
    nameTa: "திவ்யா",
    age: 1,
    sex: "F",
    village: "Chinna Odai",
    ashaId: "asha-thenmozhi",
    lastVisit: "2026-06-15",
    nextVisit: "2026-07-15",
    medicines: [],
    vitals: [{ date: "2026-06-15", weightKg: 8.1 }],
    documents: [],
  },
  {
    id: "p-priya",
    name: "Priya",
    nameTa: "பிரியா",
    age: 21,
    sex: "F",
    village: "Chinna Odai",
    ashaId: "asha-thenmozhi",
    lastVisit: "2026-08-20",
    nextVisit: "2026-09-03",
    medicines: [med("m11", "Ferrous sulphate", "200 mg", "once daily")],
    vitals: [
      { date: "2026-08-05", bpSystolic: 110, bpDiastolic: 70, hemoglobin: 9.8 },
      { date: "2026-08-20", bpSystolic: 112, bpDiastolic: 72, hemoglobin: 10.1 },
    ],
    documents: [],
  },
  {
    id: "p-raman",
    name: "Raman",
    nameTa: "ராமன்",
    age: 70,
    sex: "M",
    village: "Mettu Street",
    ashaId: "asha-karpagam",
    lastVisit: "2026-05-12",
    nextVisit: "2026-06-12",
    medicines: [
      med("m12", "Amlodipine", "5 mg", "once daily"),
      med("m13", "Atorvastatin", "10 mg", "once nightly"),
    ],
    vitals: [{ date: "2026-05-12", bpSystolic: 160, bpDiastolic: 96, weightKg: 62 }],
    documents: [],
  },
  {
    id: "p-kavitha",
    name: "Kavitha",
    nameTa: "கவிதா",
    age: 35,
    sex: "F",
    village: "Mettu Street",
    ashaId: "asha-karpagam",
    pregnant: true,
    gestationalWeek: 16,
    lastVisit: "2026-08-25",
    nextVisit: "2026-09-15",
    medicines: [med("m14", "Folic acid", "5 mg", "once daily")],
    vitals: [{ date: "2026-08-25", bpSystolic: 112, bpDiastolic: 74, hemoglobin: 11.0 }],
    documents: [],
  },
  {
    id: "p-anbu",
    name: "Anbu",
    nameTa: "அன்பு",
    age: 8,
    sex: "M",
    village: "Keelamalligai",
    ashaId: "asha-meena",
    lastVisit: "2026-08-30",
    medicines: [med("m15", "Amoxicillin", "250 mg", "three times daily")],
    vitals: [{ date: "2026-08-30", weightKg: 22 }],
    documents: [],
  },
  {
    id: "p-meenadevi",
    name: "Meena Devi",
    nameTa: "மீனா தேவி",
    age: 67,
    sex: "F",
    village: "Chinna Odai",
    ashaId: "asha-thenmozhi",
    lastVisit: "2026-07-08",
    nextVisit: "2026-08-08",
    medicines: [
      med("m16", "Metformin", "500 mg", "twice daily"),
      med("m17", "Amlodipine", "5 mg", "once daily"),
      med("m18", "Ibuprofen", "400 mg", "twice daily"),
      med("m19", "Paracetamol", "500 mg", "as needed"),
    ],
    vitals: [{ date: "2026-07-08", bpSystolic: 154, bpDiastolic: 90, weightKg: 64 }],
    documents: [],
  },
];

export const PATIENTS: Patient[] = [...CORE_PATIENTS, ...extraPatients()];
