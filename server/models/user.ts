import { Document } from "mongoose";
import {model, Schema} from "mongoose";


export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: "user" | "admin"| "owner"
}
const UserSchema = new Schema<IUser>(
    {
        name:{
            type: String,
            required: true,
            trim: true
        },
        email:{
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true
        },
        password:{
            type: String,
            required: true,
            minlength: 6
        },
        phone:{
            type: String,
            required: true,
            trim: true
        },
        role:{
            type: String,
            enum: ["user", "admin", "owner"],
            default: "user"
        }
    },
    {
        timestamps: true
    }
)
// REmove the passwrord field when returning the user object
UserSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    delete ret.password;
    return ret;
  },
});
export const User = model<IUser>("User", UserSchema);