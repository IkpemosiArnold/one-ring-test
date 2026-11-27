// One test case, two copies. The clean copy is the Evaluation section of the
// Selects README (github.com/IkpemosiArnold/selects), lightly cut to sentences.
// The twin is the same text with six errors planted on purpose. The key lists them.

export const CLASSES = {
  numbers: "Numbers disagree",
  overclaim: "Claim goes past the statistics",
  selection: "Exclusion or sampling problem",
  prereg: "Exploratory reported as pre-registered",
};

export const CLEAN = [
  { id: "S1", text: "The question is whether a free open model picks the moments viewers come back to." },
  { id: "S2", text: "The plan, hypotheses and tests were committed before any judging ran." },
  { id: "S3", text: "Data: 19 YouTube videos marked CC BY that have a Most Replayed heatmap, scored on their first 15 minutes." },
  { id: "S4", text: "Four more were excluded before judging: three failed the transcript quality gate, and one had too many non-English words." },
  { id: "S5", text: "The channels are based in the United States (9), Nigeria (2), the United Kingdom (2), Canada, Ghana, Gibraltar, India, the Netherlands and Switzerland." },
  { id: "S6", text: "The judge, Gemma 4 26B-A4B, scored a random sample of 456 windows." },
  { id: "S7", text: "Gemma 4's AUC against replay intensity was 0.56 (95% CI 0.49 to 0.62), where 0.5 is chance." },
  { id: "S8", text: "None of the four pre-registered hypotheses is supported at this n: Gemma 4 above chance, Gemma 4 above the stage 1 rules, Gemma 4 above a loudness-and-pace baseline, and the stage 1 rules above chance." },
  { id: "S9", text: "Exploratory (not pre-registered): the blend the app ranks by scored 0.57 (0.51 to 0.64)." },
  { id: "S10", text: "At the effect seen, about 52 videos would be needed for 80% power against chance." },
  { id: "S11", text: "With Gemma 4, the faithful-cut check flagged 10 of 95 top picks." },
  { id: "S12", text: "Its precision is not measured yet." },
];

const PLANTED = {
  S4: "Four more were excluded after judging, because their scores were unusually low.",
  S5: "The channels are based in the United States (11), Nigeria (2), the United Kingdom (2), Canada, Ghana, Gibraltar, India, the Netherlands and Switzerland.",
  S7: "Gemma 4's AUC against replay intensity was 0.56 (95% CI 0.49 to 0.62), where 0.5 is chance, so it picks replayed moments better than chance.",
  S9: "Pre-registered: the blend the app ranks by scored 0.57 (0.51 to 0.64).",
  S10: "At the effect seen, the 19 videos give 80% power against chance.",
  S11: "With Gemma 4, the faithful-cut check flagged 10 of 95 top picks, about 1 in 5.",
};

export const TWIN = CLEAN.map((s) => ({ id: s.id, text: PLANTED[s.id] ?? s.text }));

export const KEY = [
  { id: "S4", cls: "selection", why: "Excluding videos after seeing their scores biases the result." },
  { id: "S5", cls: "numbers", why: "11 + 2 + 2 + 6 single countries = 21 channels for 19 videos." },
  { id: "S7", cls: "overclaim", why: "The interval 0.49 to 0.62 includes 0.5, so 'better than chance' is not shown." },
  { id: "S9", cls: "prereg", why: "The blend was exploratory; S2 and S8 say what was pre-registered." },
  { id: "S10", cls: "overclaim", alt: ["numbers"], why: "The S7 interval holds 0.5, so at the effect seen 19 videos cannot give 80% power (the clean copy says about 52 are needed)." },
  { id: "S11", cls: "numbers", why: "10 of 95 is about 1 in 10, not 1 in 5." },
];
