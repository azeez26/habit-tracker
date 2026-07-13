import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import globalErrorHandler from "./middleware/errorHandler.js";

dotenv.config();
const app = express();


const allowedOrigins = (process.env.CLIENT_URL || "")
.split(",")
.map((s) => s.trim())
.filter(Boolean);

const corsOprtions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    
    if (allowedOrigins.includes(origin)) return cb(null, true);
    
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-type", "Authorization"],
};

app.use(cors(corsOprtions));
app.options("*", cors(corsOprtions));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send(" السيرفر شغال وربنا ");
});


app.use("/api/v1/auth", authRoutes);




app.use(globalErrorHandler);

const PORT = process.env.PORT || 8000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});