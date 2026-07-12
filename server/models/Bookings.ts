import { Document } from "mongoose";
import { model, Schema, Types } from "mongoose";
import crypto from "crypto";


export interface IBookings extends Document {
    user: Types.ObjectId;
    resturant: Types.ObjectId;
    date: Date;
    time: string;
    guests: number;
    occassion?: string;
    specialRequests?: string;
    status: "completed" | "confirmed" | "cancelled"
    bookingId: string;
    createdAt: Date;
    updatedAt: Date;
}
const BookingSchema = new Schema<IBookings>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        resturant: {
            type: Schema.Types.ObjectId,
            ref: "Resturant",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        guests: {
            type: Number,
            required: true,
            min: 1,
        },
        occassion: {
            type: String,
            trim: true
        },
        specialRequests: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["completed", "confirmed", "cancelled"],
            default: "confirmed"
        },
        bookingId: {
            type: String,
            unique: true
        }

    },
    {
        timestamps: true
    }
)
// Generate a unique booking ID before saving
BookingSchema.pre("save", function (this: IBookings, next: any) {
    if (!this.bookingId) {
        this.bookingId = `GR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    }
    next();
});
export const Booking = model<IBookings>("Booking", BookingSchema);