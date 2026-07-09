import { Router } from "express";
import { createOwnerResturant, getOwnerBookings, getOwnerResturants, updateBookingStatus, updateOwnerResturant } from "../controllers/ownerController.js";
import upload from "../config/multi.js";
import { ownerOnly, protect } from "../middlewares/auth.js";

const ownerRouter = Router();

ownerRouter.use(protect);
ownerRouter.use(ownerOnly);


ownerRouter.get("/resturant", getOwnerResturants);
ownerRouter.post("/resturant", upload.single("image"), createOwnerResturant);
ownerRouter.put("/resturant", upload.single("image"), updateOwnerResturant);
ownerRouter.get("/bookings", getOwnerBookings);
ownerRouter.put("/bookings/:id/status", updateBookingStatus);

export default ownerRouter