/** Demo map of public SNOMED CT substance concepts. Not a terminology server. */

export const SNOMED: Record<string, { code: string; display: string }> = {
  paracetamol: { code: "387517004", display: "Paracetamol" },
  metformin: { code: "372567009", display: "Metformin" },
  amlodipine: { code: "386864001", display: "Amlodipine" },
  ibuprofen: { code: "387207008", display: "Ibuprofen" },
  ferrous: { code: "387406002", display: "Ferrous sulfate" },
  calcium: { code: "387307005", display: "Calcium carbonate" },
  folic: { code: "63718003", display: "Folic acid" },
  pantoprazole: { code: "372525000", display: "Pantoprazole" },
  diclofenac: { code: "387282005", display: "Diclofenac" },
  levothyroxine: { code: "768557004", display: "Levothyroxine sodium" },
  cetirizine: { code: "372520005", display: "Cetirizine" },
  aspirin: { code: "387458008", display: "Aspirin" },
  amoxicillin: { code: "372687004", display: "Amoxicillin" },
};

export function snomedFor(generic: string) {
  return SNOMED[generic];
}
