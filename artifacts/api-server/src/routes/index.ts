import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import boardRouter from "./board";
import eventsRouter from "./events";
import gameRouter from "./game";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(boardRouter);
router.use(eventsRouter);
router.use(gameRouter);

export default router;
