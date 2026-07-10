import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import videosRouter from "./videos.js";
import charactersRouter from "./characters.js";
import promptsRouter from "./prompts.js";
import providersRouter from "./providers.js";
import creditsRouter from "./credits.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/videos", videosRouter);
router.use("/characters", charactersRouter);
router.use("/prompts", promptsRouter);
router.use("/providers", providersRouter);
router.use("/credits", creditsRouter);
router.use("/admin", adminRouter);

export default router;
