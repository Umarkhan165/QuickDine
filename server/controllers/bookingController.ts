
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Resturant } from "../models/Resturant.js";
import { Booking } from "../models/Bookings.js";
import { time } from "console";




// Create new bookings
// /api/bookings
// @ access private(only logged in user can accessy this api)

export const createBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { resturantid, time, guests, date, occasion, specialRequests } = req.body;
        if (!resturantid || !time || !guests || !date) {
            res.status(400).json({ message: "Please provide all the reservation details" });
            return;
        }
        // Check if the resturant is avaliable or not 
        const resturant = await Resturant.findById(resturantid);
        if (!resturant) {
            res.status(404).json({ message: "Resturant not found" });
            return;
        }
        // verify resturant is approved
        if (resturant.status !== "approved") {
            res.status(400).json({ message: "Reservations are not open for this resturant" });
            return;
        }
        // verify seats availiability
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
        // Poplulate resturant into before returning
        const populateBooking = await booking.populate("resturant", "name location image address")
        res.status(201).json(populateBooking)

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get logged in user's bookings
// GET /api/bookings/my
// @ access private(only logged in user can accessy this api)

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const bookings = await Booking.find({ user: req.user?._id }).populate("resturant", "name location image").sort({ date: -1, time: -1 })
        res.json(bookings)
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


// Cancel a booking
// PUT /api/bookings/:id/cancel
// @ access private(only logged in user can accessy this api)

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const booking = await Booking.findById(req.params.id);

        if(!booking) {
            res.status(404).json({ message: "Booking not found"});
            return;
        }

        // Verify user owns the bookings 
        if(booking.user.toString() !== req.user?._id.toString()) {
            res.status(401).json({ message: "Unauthorized to cancel this booking"});
            return;
        }

        booking.status = "cancelled"
        await booking.save()
        res.json({ message: "Booking cancelled successfully"})

        const populatedBooking = await booking.populate("resturant", "name location image")
        res.json(populatedBooking)                       
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}