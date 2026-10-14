// The four MBTI dichotomies. Each axis has its own colour throughout the UI.
export const AXES = [
  { key: 'EI', left: 'E', right: 'I', leftName: 'Extraversion', rightName: 'Introversion', score: 'scoreE', color: 'var(--ax-ei)', hint: 'Where you draw energy' },
  { key: 'SN', left: 'N', right: 'S', leftName: 'Intuition', rightName: 'Sensing', score: 'scoreN', color: 'var(--ax-sn)', hint: 'How you take in information' },
  { key: 'TF', left: 'T', right: 'F', leftName: 'Thinking', rightName: 'Feeling', score: 'scoreT', color: 'var(--ax-tf)', hint: 'How you decide' },
  { key: 'JP', left: 'J', right: 'P', leftName: 'Judging', rightName: 'Perceiving', score: 'scoreJ', color: 'var(--ax-jp)', hint: 'How you plan' },
];

export const LETTER_COLOR = {
  E: 'var(--ax-ei)', I: 'var(--ax-ei)',
  S: 'var(--ax-sn)', N: 'var(--ax-sn)',
  T: 'var(--ax-tf)', F: 'var(--ax-tf)',
  J: 'var(--ax-jp)', P: 'var(--ax-jp)',
};

export const LETTER_WORD = {
  E: 'Social', I: 'Reflective', S: 'Practical', N: 'Big-picture',
  T: 'Analytical', F: 'People-focused', J: 'Structured', P: 'Exploratory',
};

export const FORMAT_LABEL = {
  READING: 'Reading', VIDEO: 'Video', INTERACTIVE: 'Interactive',
  DISCUSSION: 'Discussion', PROJECT: 'Project', QUIZ: 'Quiz',
};

export const LEVEL_LABEL = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };

export const minutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m}m`);
