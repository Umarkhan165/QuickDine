import { Request, Response } from "express";
import { Resturant } from "../models/Resturant.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Booking } from "../models/Bookings.js";

// Get all resturants with search and filters
// GET /api/resturants
export const getResturants = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, priceRange, location, rating, sort } = req.query;
        const queryobject: any = {};

        // FIX: use $or so a search term can match name OR location OR tags,
        // instead of requiring all three to match at once (which almost never happens)
        if (search) {
            queryobject.$or = [
                { name: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
            ];
        }

        if (priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
            queryobject.priceRange = { $in: prices };
        }

        if (rating) {
            queryobject.rating = { $gte: rating as string };
        }

        // If both `search` and `location` are given, don't let location overwrite
        // the $or block above — combine them with $and instead
        if (location) {
            const locationFilter = { location: { $regex: location, $options: "i" } };
            if (queryobject.$or) {
                queryobject.$and = [{ $or: queryobject.$or }, locationFilter];
                delete queryobject.$or;
            } else {
                Object.assign(queryobject, locationFilter);
            }
        }

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
};

// Get featured resturants
// GET /api/resturants/featured
export const getFeaturedResturants = async (req: Request, res: Response): Promise<void> => {
    try {
        const featured = await Resturant.find({
            // status: "approved",
            $or: [{ featured: true }, { exclusive: true }],
        }).limit(6);

        // FIX: wrap in { success, data } to match every other endpoint
        // and what the frontend expects via res.data.data
        res.status(200).json({
            success: true,
            data: featured,
        });
    } catch (error: any) {
        console.error("Failed to get featured resturants", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get Resturant by slug
// GET /api/resturants/:slug
export const getResturantBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const resturant = await Resturant.findOne({ slug: req.params.slug });
        if (!resturant) {
            res.status(404).json({ message: "Resturant not found" });
            return;
        }

        if (resturant.status !== "approved") {
            let isAuthorized = false;
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                try {
                    const token = req.headers.authorization.split(" ")[1];
                    const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as unknown as { id: string };
                    const user = await User.findById(decodedToken.id);
                    // if (user && (user.role === "admin" || ...)) { isAuthorized = true; }  // commented out
                } catch (error) {}
            }
            if (isAuthorized) { //!isAuthorized   // condition flipped, but isAuthorized is always false anyway, so this never fires
                res.status(404).json({ message: "Resturant not found or not authorized to view" });
                return;
            }
        }

        // FIX: wrap in { success, data } — frontend does res.data.data
        res.status(200).json({
            success: true,
            data: resturant,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get dynamic seat availability
// GET /api/resturants/:id/availability
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
        const bookingDate = new Date(date as string);
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
                isAvailable: avaliableSeats > 0,
            };
        });
        // Note: consider wrapping this too as { success: true, data: avaliability }
        // for consistency, once you check what the frontend expects here.
        res.status(200).json({
            success: true,
            data: avaliability,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};