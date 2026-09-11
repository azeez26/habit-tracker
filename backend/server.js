import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import habitRoutes from "./src/routes/habit.routes.js";
import dashboardRoutes from './src/routes/dashboard.routes.js';
import globalErrorHandler from "./src/middleware/errorHandler.js";

dotenv.config();
const app = express();


const allowedOrigins = (process.env.CLIENT_URL || "")
.split(",")
.map((s) => s.trim())
.filter(Boolean);

const corsOptions = {
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

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send(" السيرفر شغال وربنا ");
});


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/habits", habitRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);




app.use(globalErrorHandler);

const PORT = process.env.PORT || 8000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});