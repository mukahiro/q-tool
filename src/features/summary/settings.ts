export const SUMMARY_LANGUAGE_OPTIONS = [
  { value: "ja", label: "日本語", instruction: "日本語で書く。" },
  { value: "en", label: "英語", instruction: "英語で書く。" },
] as const;

export const SUMMARY_TONE_OPTIONS = [
  {
    value: "standard",
    label: "標準",
    instruction: "標準的な口調にする。",
  },
  {
    value: "ojousama",
    label: "お嬢様",
    instruction:
      "上品なお嬢様口調にする。",
  },
  {
    value: "butler",
    label: "執事",
    instruction:
      "丁寧で控えめな執事口調にする。",
  },
  {
    value: "friendly",
    label: "フレンドリー",
    instruction:
      "親しみやすく前向きな口調にする。",
  },
  {
    value: "kansai",
    label: "関西弁",
    instruction:
      "関西弁の口調にする。",
  },
] as const;

export type SummaryLanguage = (typeof SUMMARY_LANGUAGE_OPTIONS)[number]["value"];
export type SummaryTone = (typeof SUMMARY_TONE_OPTIONS)[number]["value"];

export const DEFAULT_SUMMARY_LANGUAGE: SummaryLanguage = "ja";
export const DEFAULT_SUMMARY_TONE: SummaryTone = "standard";

export function normalizeSummaryLanguage(value: unknown): SummaryLanguage {
  return SUMMARY_LANGUAGE_OPTIONS.some((option) => option.value === value)
    ? (value as SummaryLanguage)
    : DEFAULT_SUMMARY_LANGUAGE;
}

export function normalizeSummaryTone(value: unknown): SummaryTone {
  return SUMMARY_TONE_OPTIONS.some((option) => option.value === value)
    ? (value as SummaryTone)
    : DEFAULT_SUMMARY_TONE;
}

export function getSummaryLanguageLabel(language: SummaryLanguage) {
  return (
    SUMMARY_LANGUAGE_OPTIONS.find((option) => option.value === language)
      ?.label ?? "日本語"
  );
}

export function getSummaryToneLabel(tone: SummaryTone) {
  return (
    SUMMARY_TONE_OPTIONS.find((option) => option.value === tone)?.label ??
    "標準"
  );
}

export function getSummaryLanguageInstruction(language: SummaryLanguage) {
  return (
    SUMMARY_LANGUAGE_OPTIONS.find((option) => option.value === language)
      ?.instruction ?? SUMMARY_LANGUAGE_OPTIONS[0].instruction
  );
}

export function getSummaryToneInstruction(tone: SummaryTone) {
  return (
    SUMMARY_TONE_OPTIONS.find((option) => option.value === tone)
      ?.instruction ?? SUMMARY_TONE_OPTIONS[0].instruction
  );
}
