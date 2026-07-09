import { Router } from "express";
import { approveResturant, getAdminResturants, getAdminStats } from "../controllers/adminController.js";
import { adminOnly, protect } from "../middlewares/auth.js";

const adminRouter = Router();

adminRouter.use(protect)
adminRouter.use(adminOnly)


adminRouter.get("/resturants", getAdminResturants);
adminRouter.put("/resturants/:id/approve", approveResturant);
adminRouter.get("/stats", getAdminStats);
export default adminRouter;