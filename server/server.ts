import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import resturantRouter from "./routes/resturantroutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const app = express();

await connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live!");
});
app.use("/api/auth", authRouter)
app.use("/api/resturants", resturantRouter)
app.use("/api/bookings", bookingRouter)
app.use("/api/owner", ownerRouter)
app.use("/api/admin", adminRouter)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
});

// Only actually bind to a port when running locally — Vercel invokes
// the exported app directly per-request instead of listening on a port
if (process.env.VERCEL !== "1") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

export default app; // FIX: this is what Vercel actually needs to invoke