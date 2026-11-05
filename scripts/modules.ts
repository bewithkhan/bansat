// The framework's modules, in reading order. scripts/build-framework.ts joins them into
// reference/bansat-framework.md, and the checks make sure every module exists and is used.
export const FRAMEWORK_DIR = 'framework';
export const COMBINED_FILE = 'reference/bansat-framework.md';

export const MODULES = [
  'cover.md',
  'how-to-use.md',
  '00-intake.md',
  '01-prd.md',
  '02-nfr.md',
  '03-trd.md',
  '04-adrs.md',
  '05-data.md',
  '06-api.md',
  '07-security.md',
  '08-ai.md',
  '09-privacy.md',
  '10-experience.md',
  '11-delivery.md',
  '12-agent-manual.md',
  '13-launch-gate.md',
  '14-retrofit.md',
  'appendix-a-templates.md',
  'appendix-b-references.md',
  'appendix-c-glossary.md',
  'appendix-d-stacks.md',
  'appendix-e-methods.md',
  'appendix-e1-scrum.md',
  'appendix-e2-kanban.md',
  'appendix-e3-stage-gates.md',
  'appendix-e4-shape-up.md',
  'appendix-e5-solo.md',
  'appendix-e6-scaled.md',
  'appendix-f-casebook.md',
] as const;
