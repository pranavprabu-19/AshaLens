const KEY = "ashalens.v1";

export type StoredState = {
  consentAt?: string;
  extraByPatient: Record<
    string,
    {
      medicines?: import("./types").Medicine[];
      documents?: import("./types").CapturedDocument[];
      vitals?: import("./types").Vital[];
      abhaId?: string;
    }
  >;
};

const empty = (): StoredState => ({ extraByPatient: {} });

export function loadState(): StoredState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export function saveState(next: StoredState) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function acceptConsent() {
  const s = loadState();
  s.consentAt = new Date().toISOString();
  saveState(s);
}

export function hasConsent() {
  return Boolean(loadState().consentAt);
}

export function patchPatient(
  patientId: string,
  patch: StoredState["extraByPatient"][string],
) {
  const s = loadState();
  const prev = s.extraByPatient[patientId] ?? {};
  s.extraByPatient[patientId] = {
    medicines: patch.medicines ?? prev.medicines,
    documents: patch.documents ?? prev.documents,
    vitals: patch.vitals ?? prev.vitals,
    abhaId: patch.abhaId !== undefined ? patch.abhaId : prev.abhaId,
  };
  saveState(s);
}
