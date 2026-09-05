import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 3000,

  databasePath:
    process.env.DATABASE_PATH || "./data/quill.db",

  jwtSecret:
    process.env.JWT_SECRET ||
    "development-secret-change-me",
};