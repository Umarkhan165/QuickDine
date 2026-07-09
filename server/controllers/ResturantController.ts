// import asyncHandler from "../middlewares/asyncHandler";
import { Request, Response } from "express";
import { Resturant } from "../models/Resturant.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Booking } from "../models/Bookings.js";
import { error } from "console";
// get all resturanst with search and filters
export const getResturants = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, priceRange, salt, location, rating, sort } = req.query;
        // Build a Query Object 
        const queryobject: any = { status: "approved" };

        if (search) {
            queryobject.name = { $regex: search, $options: "i" };
            queryobject.location = { $regex: search, $options: "i" };
            queryobject.tags = { $regex: search, $options: "i" };
        }
        if (priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
            queryobject.priceRange = { $in: prices };
        }
        if (rating) {
            queryobject.rating = { $gte: rating as string };
        }
        if (location) {
            queryobject.location = { $regex: location, $options: "i" };
        }
        // Sort
        let sortOptions: any = { createdAt: -1 };
        if (sort === "rating") {
            sortOptions = { rating: -1 };
        } else if (sort === "reviews") {
            sortOptions = { reviewCount: -1 };
        } else if (sort === "priceHigh") {
            sortOptions = { priceRange: -1 };
        } else if (sort === "priceLow") {
            sortOptions = { priceRange: 1 };
        }
        const resturants = await Resturant.find(queryobject).sort(sortOptions);
        res.status(200).json({
            success: true,
            data: resturants,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
// Get featured resturants
// Get /api/resturants/featured
export const getFeaturedResturants = async (req: Request, res: Response): Promise<void> => {
    try {
        const featured = await Resturant.find({
            status: "approved",
            $or: [{ featured: true }, { exclusive: true }],
        }).limit(6);
        res.json(featured);
    } catch (error: any) {
        console.error("Failed to get featured resturants", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
// Get Resturnat by slug
// GET /api/resturants/:slug
export const getResturantBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const resturant = await Resturant.findOne({ slug: req.params.slug });
        if (!resturant) {
            res.status(404).json({ message: "Resturant not found" });
            return;
        }
        // If not approved, verify  authorization (owner or admin) 
        if (resturant.status !== "approved") {
            let isAuthorized = false;
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                try {
                    const token = req.headers.authorization.split(" ")[1];
                    const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as unknown as { id: string };
                    const user = await User.findById(decodedToken.id);
                    if (user && (user.role === "admin" || (user.role === "owner" &&
                        resturant.owner.toString() === user._id.toString()))) {
                        isAuthorized = true;
                    }
                } catch (error) {
                    // Ignore the token verify error.  
                }
            }
            if (!isAuthorized) {
                res.status(404).json({ message: "Resturant not found or not authorized to view" });
                return;
            }
        }
        res.json(resturant);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
// Get dynmaic seat avaliability
// GET /api/resturants/:id/avaliability
export const getResturantAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ message: "Date is required" });
            return;
        }
        const resturant = await Resturant.findById(req.params.id);
        if (!resturant) {
            res.status(404).json({ message: "Resturant not found" });
            return;
        }
        // Get bookings for the date
        const bookingDate = new Date(date as string);

        // Get all active bookings on this date for this resturant
        const bookings = await Booking.find({
            resturant: resturant._id,
            date: bookingDate,
            status: { $in: ["confirmed", "completed"] },
        });
        const avaliability = resturant.avaliableSlots.map((slot) => {
            const BookedSeats = bookings.filter((b) => b.time === slot)
                .reduce((sum, b) => sum + b.guests, 0);
            const totalSeats = resturant.totalSeats || 20;
            const avaliableSeats = Math.max(0, totalSeats - BookedSeats);
            return {
                time: slot,
                avaliableSeats,
                isAvailable: avaliableSeats > 0
            };
        });
        res.json(avaliability);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
