import { Router } from "express";
import { getAllProviders } from "../providers/index.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /providers
router.get("/", requireAuth, async (_req, res) => {
  try {
    const providers = getAllProviders().map((p) => ({
      id: p.id,
      name: p.name,
      enabled: p.hasKey || p.isMock,
      supportsImageToVideo: p.supportsImageToVideo,
      supportedDurations: p.supportedDurations,
      supportedAspectRatios: p.supportedAspectRatios,
      isMock: p.isMock,
      description: p.description,
    }));

    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch providers." });
  }
});

export default router;
