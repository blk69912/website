export type Severity = "error" | "warning" | "info";
export interface Finding { severity: Severity; path: string; message: string }
