import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Booking } from "../models/Bookings.js";
import { Resturant } from "../models/Resturant.js";
import {v2 as cloudinary} from 'cloudinary';


// Helper function to upload buffer to cloudinary
const uploadtoCloudinary = (fileBuffer:Buffer) :Promise<{secure_url:string}> => {
    return new Promise((resolve, reject)=> {
        const stream = cloudinary.uploader.upload_stream({folder:"QuickDine"}, (error, result)=> {
            if(error) return reject(error);
            if(!result) return reject(new Error("Upload failed"))
            resolve({secure_url: result.secure_url})
        })
        stream.end(fileBuffer);
    })
}

// Get Owner's Resturants
// GET /api/owner/resturant
export const getOwnerResturants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const resturant = await Resturant.findOne({ owner: req.user?._id });
        res.status(200).json(resturant); // null if none exists — frontend's `!restaurant` check handles that correctly
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Create Owner's Resturant(submitted to pending)
// POST /api/owner/resturant
export const createOwnerResturant = async (req:AuthRequest, res:Response):Promise<void>=> {
    try {
        const existing = await Resturant.findOne({ owner: req.user?._id })
        if(existing) {
            res.status(400).json({ message: "You already have a registered Resturant"})
            return
        }
        const { name, address, description, tags, priceRange, cuisine, phone, chef, totalSeats, openingHours, avaliableSlots, location }
        = req.body;

        // Basic validation 
        if(!name || !address || !description || !priceRange || !cuisine || !phone || !chef || !totalSeats || !openingHours || !location) {
            res.status(400).json({ message: "Missing required fields"})
            return
        }
        // Suppose this data is avaliable generate the slog from these names
        const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|- $)+/g, "")
        const slugExits = await Resturant.findOne({slug});  
        if(slugExits){
            res.status(400).json({ message: "Resturant with this name already exists"})
            return
        }
        // Handle image 
        let imageUrl = ""
        if(req.file) {
            const result = await uploadtoCloudinary(req.file.buffer)
            imageUrl = result.secure_url;
        }

        // Setup parse tags and slots
        const parsedTags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()) :tags || [];

        const parsedSlots = typeof avaliableSlots === "string" ?avaliableSlots.split(",").map((t)=> t.trim()):avaliableSlots || ["17:00","18:00", "19:00", "20:00", "21:00"];

        const resturant = new Resturant({
            name,
            slug,
            address,
            description,
            priceRange,
            cuisine,
            location,
            phone,
            chef,
            tags: parsedTags,
            avaliableSlots: parsedSlots,
            totalSeats: totalSeats ? Number(totalSeats): 20,
            owner: req.user?._id,
            status: "pending",
            image: imageUrl,
        })

        await resturant.save()

        res.status(201).json({ success: true, data: resturant })
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
// Update Owner's Resturant
// PUT /api/owner/resturant/
export const updateOwnerResturant = async (req:AuthRequest, res:Response):Promise<void>=> {
    try {
        const resturant = await Resturant.findOne({owner:req.user?._id})
        if(!resturant) {
            res.status(404).json({message: "Resturant not found"})
            return
        }
        
        const { name, address, description, tags, priceRange, cuisine, phone, chef, openingHours,avaliableSlots, totalSeats} 
        = req.body;
        if(name) resturant.name = name;
        if(address) resturant.address = address;
        if(description) resturant.description = description;
        if(priceRange) resturant.priceRange = priceRange;
        if(cuisine) resturant.cuisine = cuisine;
        if(phone) resturant.phone = phone;
        if(chef) resturant.chef = chef;
        if(totalSeats) resturant.totalSeats = totalSeats;
        if(openingHours) resturant.openingHours = openingHours;
        if(tags) resturant.tags = typeof tags === "string" ? tags.split(",").map((t)=>t.trim()):tags;
        
        if(avaliableSlots) {
            resturant.avaliableSlots = typeof avaliableSlots === "string" ? avaliableSlots.split(",").map((t)=>t.trim()):avaliableSlots;
        }


        // Handle if new image uploaded
        if(req.file) {
            const result = await uploadtoCloudinary(req.file.buffer)
            resturant.image = result.secure_url;
        }
        const update = await resturant.save();
        res.json(resturant);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
// Get bookings for owner's resturnat 
// GET /api/owner/bookings/
export const getOwnerBookings = async (req:AuthRequest, res:Response):Promise<void>=> {
    try {
        const resturant = await Resturant.findOne({owner:req.user?._id})
        if(!resturant) {
            res.status(404).json({message: "Resturant not found"})
            return
        }
        const bookings = await Booking.find({resturant:resturant._id}).populate("user", "name email phone").sort({date:-1, time:-1})
        res.json(bookings)
        
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
// Get status of bookings for owner's resturnat 
// PUT /api/owner/bookings/:id/status
export const updateBookingStatus = async (req:AuthRequest, res:Response):Promise<void>=> {
    try {
        const {status} = req.body;
        if(!status || !["confirmed", "cancelled", "completed", "rejected"].includes(status)) {
            res.status(400).json({message:"Invalid status"})
            return
        }

        const booking = await Booking.findById(req.params.id);
        if(!booking){
            res.status(404).json({message:"Booking not found"})
            return
        }

        // Verify bookings belongs to  owner's resturant
        const resturant = await Resturant.findById(booking.resturant)
        if(!resturant || resturant.owner.toString()!== req.user?._id.toString()){
            res.status(401).json({message:"Not authorized to manage this booking"})
            return
        }   
        booking.status = status;
        await booking.save();
        res.json(booking)
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}