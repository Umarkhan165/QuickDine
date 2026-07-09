import { Request, Response } from "express";
import jwt from "jsonwebtoken"; 
import { User } from "../models/user.js";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middlewares/auth.js";

// Helper function to generate JWT token
const generateToken = (id: string) => {
    return jwt.sign({id}, process.env.JWT_SECRET as string, {
        expiresIn: "30d"
    });
}

// Register a User
// POST /api/auth/register
export const registerUser = async (req: Request, res: Response):Promise<void> => {
    try {
        const { name, email, password, phone, role } = req.body;
        if(!name || !email || !password) {
            res.status(400).json({message: "Please fill all fields"});
            return;
        }

        // Check if user exists
        const userExists = await User.findOne({email});
        if(userExists) {
            res.status(400).json({message: "User already exists"});
            return;
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role
        });
        if(user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user.id)
            });
        } else {
            res.status(400).json({message: "Invalid user data"});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
}

// Authenticate a User and get a token
// POST /api/auth/login
export const loginUser = async (req: Request, res: Response):Promise<void> => {
    try {
        const { email, password } = req.body;
        if ( !email || !password) {
            res.status(400).json({ message: "Please provide email and password" });
            return;
        }

        // Check for user
        const user = await User.findOne({ email });
        if(!user) {
            res.status(401).json({message:"Invalid email or passowrd"})
            return;
        }

        // Check if password matches (user.password is not undefined bacause we queried it)
        const isMatch = await bcrypt.compare(password, user.password || "")
        if(!isMatch) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user.id),
        });

    } catch (error:any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

// Get User Profile
// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        if(!req.user) {
            res.status(401).json({ message:"Not authorized"})
            return;
        }
        res.json(req.user);
    } catch (error:any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}