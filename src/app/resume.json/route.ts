import profile from "@/content/profile.json";

export function GET() {
  return Response.json({ $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json", ...profile });
}
