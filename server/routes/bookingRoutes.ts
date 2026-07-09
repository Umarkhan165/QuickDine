import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { cancelBooking, createBookings, getMyBookings } from "../controllers/bookingController.js";


const bookingRouter = Router();

bookingRouter.post("/" , protect, createBookings)
bookingRouter.get("/my", protect, getMyBookings)
bookingRouter.put("/:id/cancel", protect, cancelBooking)

export default bookingRouter;