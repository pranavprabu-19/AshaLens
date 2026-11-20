export type Role = "asha" | "doctor";

export type DocumentType = "prescription" | "lab_slip" | "mcp_card" | "other";

export type QualityLabel = "ok" | "blur" | "dark";

export type Sex = "F" | "M";

export type Medicine = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  confirmed: boolean;
};

export type Vital = {
  date: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  weightKg?: number;
  hemoglobin?: number;
};

export type AlertKind = "interaction" | "duplicate" | "overdue" | "danger_sign" | "allergy";
export type Severity = "high" | "medium" | "info";

export type Alert = {
  id: string;
  severity: Severity;
  kind: AlertKind;
  message: string;
  messageTa?: string;
};

export type CapturedDocument = {
  id: string;
  type: DocumentType;
  quality: QualityLabel;
  capturedAt: string;
  note?: string;
  dataUrl?: string;
};

export type AllergyRecord = {
  id: string;
  allergen: string;
  mappedSalts: string[];
  category: "drug" | "food" | "environment";
  severity: "high" | "moderate";
  reactionTamil: string;
  reactionEn: string;
};

export type VaultDrug = {
  name: string;
  dose: string;
  schedule: string;
};

export type HealthRecordItem = {
  id: string;
  date: string;
  docType: "prescription" | "lab_slip" | "mcp_card";
  facility: string;
  imageUrl?: string;
  confirmedEntities: {
    drugs?: VaultDrug[];
    vitals?: { hb?: number; bpSystolic?: number; bpDiastolic?: number; weightKg?: number };
  };
  safetyFlags: string[];
  tamilSummary: string;
  verifiedByHuman: boolean;
};

export type Patient = {
  id: string;
  name: string;
  nameTa: string;
  age: number;
  sex: Sex;
  village: string;
  phone?: string;
  ashaId: string;
  pregnant?: boolean;
  gestationalWeek?: number;
  lastVisit: string;
  nextVisit?: string;
  medicines: Medicine[];
  vitals: Vital[];
  documents: CapturedDocument[];
  reportedSigns?: string[];
  abhaId?: string;
  bloodGroup?: string;
  householdId?: string;
  allergies?: AllergyRecord[];
  vaultRecords?: HealthRecordItem[];
  shareUntil?: string;
};

export type Asha = {
  id: string;
  name: string;
  village: string;
};

export type Session = {
  role: Role;
  name: string;
  ashaId?: string;
};

export type QualityEstimate = {
  label: QualityLabel;
  brightness: number;
  sharpness: number;
  advice: string;
};
