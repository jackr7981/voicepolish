import { neon } from "@neondatabase/serverless";

export function getDb() {
  return neon(process.env.POSTGRES_URL!);
}
