import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "يجب أن تنتمى العاده لمستخدم محدد"],
  },
  title: {
    type: String,
    required: [true, "يجب إضافة اسم للعاده"],
  },
  frequency: {
    type: String,
    enum: ["daily", "weekly", "specific_days"],
    default: "daily",
  },
},
{
    timestamps:true
});

export default mongoose.model("Habit", habitSchema)
