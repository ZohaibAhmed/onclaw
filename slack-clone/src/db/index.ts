import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://zohaibahmed@localhost/slack_clone";
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export { schema };
