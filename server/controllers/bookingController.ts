import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Resturant } from "../models/Resturant.js";
import { Booking } from "../models/Bookings.js";

// POST /api/bookings
export const createBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { resturantid, time, guests, date, occasion, specialRequests } = req.body;
        if (!resturantid || !time || !guests || !date) {
            res.status(400).json({ message: "Please provide all the reservation details" });
            return;
        }

        const resturant = await Resturant.findById(resturantid);
        if (!resturant) {
            res.status(404).json({ message: "Resturant not found" });
            return;
        }

        // if (resturant.status !== "approved") {
        //     res.status(400).json({ message: "Reservations are not open for this resturant" });
        //     return;
        // }

        const requestedGuests = Number(guests)
        const existingBookings = await Booking.find({
            resturant: resturantid,
            date: new Date(date),
            time: time,
            status: "confirmed"
        })

        const bookedSeats = existingBookings.reduce((total, booking) => total + booking.guests, 0)
        const totalSeats = resturant.totalSeats || 20;
        const avaliableSeats = totalSeats - bookedSeats;
        if (requestedGuests > avaliableSeats) {
            res.status(400).json({ message: `Only ${avaliableSeats} seats are avaliable` });
            return;
        }

        const booking = await Booking.create({
            user: req.user?._id,
            resturant: resturantid,
            date: new Date(date),
            time: time,
            guests: requestedGuests,
            occassion: occasion || undefined,
            specialRequests: specialRequests || "",
        })

        const populateBooking = await booking.populate("resturant", "name location image address")

        // FIX: wrap for consistency with the rest of the API
        res.status(201).json({ success: true, data: populateBooking });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// GET /api/bookings/my
export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const bookings = await Booking.find({ user: req.user?._id })
            .populate("resturant", "name location image")
            .sort({ date: -1, time: -1 })

        // FIX: wrap in { success, data } to match res.data.data on the frontend
        res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// PUT /api/bookings/:id/cancel
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            res.status(404).json({ message: "Booking not found" });
            return;
        }

        if (booking.user.toString() !== req.user?._id.toString()) {
            res.status(401).json({ message: "Unauthorized to cancel this booking" });
            return;
        }

        booking.status = "cancelled"
        await booking.save()

        // FIX: removed the first res.json(...) call — you were sending two responses
        // for the same request, which throws "Cannot set headers after they are sent"
        const populatedBooking = await booking.populate("resturant", "name location image")
        res.status(200).json({ success: true, data: populatedBooking });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}