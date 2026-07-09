import { Document, Types } from "mongoose";
import { model, Schema } from "mongoose";

export interface IResturant extends Document {
  name: string;
  slug: string;
  description: string;
  cuisine: string;
  priceRange: "$" | "$$" | "$$$";
  rating: number;
  reviewCount: number;
  location: string;
  address: string;
  image: string;
  chef: string;
  tags: string[];
  avaliableSlots: string[];
  featured: boolean;
  exclusive: boolean;
  owner: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  totalSeats: number;
  createdAt: Date;
  updtaedAt: Date;
}
const ResturantSchema = new Schema<IResturant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    cuisine: {
      type: String,
      required: true,
      trim: true,
    },
    priceRange: {
      type: String,
      enum: ["$", "$$", "$$$"],
      default: "$$",
      required: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: ""
    },
    chef: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
    },
    avaliableSlots: {
      type: [String],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    exclusive: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    totalSeats: {
      type: Number,
      default: 20,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Resturant = model<IResturant>("Resturant", ResturantSchema);
