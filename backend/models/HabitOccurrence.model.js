const mongoose = require('mongoose');
const { Schema } = mongoose;

const goalProgressSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['duration', 'count'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    completed: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const habitOccurrenceSchema = new Schema(
  {
    habit_id: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduled_date: {
      type: String,
      required: true,
    },
    scheduled_time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'done', 'missed', 'skipped'],
      default: 'pending',
    },
    goal_progress: {
      type: goalProgressSchema,
      required: true,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);


habitOccurrenceSchema.pre('validate', function (next) {
  if (this.goal_progress?.completed > this.goal_progress?.target) {
    return next(new Error('goal_progress.completed مايقدرش يتعدى goal_progress.target'));
  }
  next();
});

habitOccurrenceSchema.index({ user_id: 1, scheduled_date: 1 });

habitOccurrenceSchema.index({ habit_id: 1, scheduled_date: 1 }, { unique: true });

const HabitOccurrence = mongoose.model('HabitOccurrence', habitOccurrenceSchema);

module.exports = { HabitOccurrence };