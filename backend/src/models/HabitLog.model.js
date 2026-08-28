import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema(
  {
    habit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['done', 'missed'],
      required: true,
    },
    progress_value: {
      type: Number,
      default: 0,
      min: 0,
    },
    logged_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

habitLogSchema.index({ habit_id: 1, date: 1, timezone: 1 }, { unique: true });


const HabitLog = mongoose.model('HabitLog', habitLogSchema);

export default HabitLog;
