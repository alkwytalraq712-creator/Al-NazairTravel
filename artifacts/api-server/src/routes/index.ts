import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import homeRouter from "./home";
import visasRouter from "./visas";
import visaApplicationsRouter from "./visaApplications";
import packagesRouter from "./packages";
import packageBookingsRouter from "./packageBookings";
import flightsRouter from "./flights";
import notificationsRouter from "./notifications";
import bannersRouter from "./banners";
import testimonialsRouter from "./testimonials";
import adminRouter from "./admin";
import visasScanRouter from "./visas-scan";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(homeRouter);
router.use(visasRouter);
router.use(visaApplicationsRouter);
router.use(packagesRouter);
router.use(packageBookingsRouter);
router.use(flightsRouter);
router.use(notificationsRouter);
router.use(bannersRouter);
router.use(testimonialsRouter);
router.use(adminRouter);
router.use(visasScanRouter);
router.use(storageRouter);

export default router;
