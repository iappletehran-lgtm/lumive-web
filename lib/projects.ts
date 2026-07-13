/**
 * Project lifecycle statuses — the single source of truth shared by the admin
 * status dropdown and the server action that validates updates. Order matches the
 * pipeline: discovery → build → launch → review → complete.
 */
export const PROJECT_STATUSES = ["discovery", "build", "launch", "review", "complete"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(v: string): v is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(v);
}
