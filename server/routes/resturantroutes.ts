import { Router } from "express";
import {
    getResturants,
    getFeaturedResturants,
    getResturantBySlug,
    getResturantAvailability
} from "../controllers/ResturantController.js";

const resturantRouter = Router();

resturantRouter.get("/", getResturants);
resturantRouter.get("/featured", getFeaturedResturants);
resturantRouter.get("/:slug", getResturantBySlug);
resturantRouter.get("/:id/availability", getResturantAvailability);

export default resturantRouter;
