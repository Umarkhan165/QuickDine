import { AuthRequest } from "../middlewares/auth.js";
import { Resturant } from "../models/Resturant.js";
import { Response } from "express";
import { User } from "../models/user.js";
import { Booking } from "../models/Bookings.js";


// Get all resturants for the admin
// GET /api/admin/resturants


export const getAdminResturants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
            const resturants = await Resturant.find({}).populate("owner", "name email phone").sort({createdAt:-1} );
            res.json(resturants);
    } catch (error:any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}
// Approve or reject a resturant profile
// PUT /api/admin/resturants/:id/approve
export const approveResturant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {status} = req.body;
        if(!status || !["approved", "rejected"].includes(status)) {
            res.status(404).json({message: "Resturant Profile not found"})
            return;
        }
        const resturant = await Resturant.findById(req.params.id)
        if(!resturant) {
            res.status(404).json({message: "Resturant not found"})
            return;
        }
        resturant.status = status;
        await resturant.save();
        res.json(resturant);
    } catch (error:any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}

// get admins statistics
// Get /api/admin/stats
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments({ role: "user"});
        const totalOwners = await User.countDocuments({ role: "owner"});
        const totalResturants = await Resturant.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalPending = await Resturant.countDocuments({status:"pending"})
        const totalApproved = await Resturant.countDocuments({status:"approved"})
        // get latest 10 bookings 
        const latestBookings = await Booking.find().populate("user", "name email").populate("resturant", "name").sort({createdAt:-1}).limit(10);

        const stats = {
            users:{
                totalUsers,
                totalOwners,
            },
            resturants: {
                totalResturants,
                totalPending,
                totalApproved,
            },
            bookings:{
                totalBookings,
            },
            latestBookings
        }
        res.json(stats);
    } catch (error:any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}
