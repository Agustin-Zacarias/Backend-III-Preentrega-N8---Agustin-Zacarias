import { asyncHandler } from "../middlewares/async-handler.js";

export const getHealth = asyncHandler(async (_req, res) => {
  return res.status(200).json({
    status: "success",
    payload: {
      status: "ok",
      environment: process.env.NODE_ENV || "unknown",
      uptimeSeconds: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
    },
  });
});
