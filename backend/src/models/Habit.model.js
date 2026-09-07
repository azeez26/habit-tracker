import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    goal_type: {
      type: String,
      enum: ["duration", "count"],
      required: true,
    },
    goal_target: {
      type: Number,
      required: true,
    },
    days: {
      type: [Number],
      default:[0,1,2,3,4,5,6]
    },
    time: {
      type: String,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    ended_at: {
      type: Date,
      default: null,
    },
    parent_habit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      default: null,
    },
    root_habit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      default: null,
    },

    stats: {
      type: {
        current_streak: {
          type: Number,
          default: 0,
        },
        best_streak: {
          type: Number,
          default: 0,
        },
        total_completions: {
          type: Number,
          default: 0,
        },
        last_completed: {
          type: String, // "YYYY-MM-DD"
          default: null,
        },
      },
      default: {
        current_streak: 0,
        best_streak: 0,
        total_completions: 0,
        last_completed: null,
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

const Habit = mongoose.model("Habit", habitSchema);

export default Habit;
