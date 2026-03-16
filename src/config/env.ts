export const env = {
  redisHost: process.env.REDIS_HOST!,
  redisPort: Number(process.env.REDIS_PORT!),
  port: Number(process.env.PORT!),
  NODE_ENV: process.env.NODE_ENV|| "development",
};
