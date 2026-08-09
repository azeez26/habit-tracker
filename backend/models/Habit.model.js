const mongoose = require('mongoose');
const { Schema } = mongoose;

const DAY_OF_WEEK = {
  SAT: 0,
  SUN: 1,
  MON: 2,
  TUE: 3,
  WED: 4,
  THU: 5,
  FRI: 6,
};

const scheduleDaySchema = new Schema(
  {
    day_of_week: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    is_checked: {
      type: Boolean,
      default: true,
    },
    time: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const habitSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
      enum: ['duration', 'count'],
      required: true,
    },
    goal_duration_seconds: {
      type: Number,
      default: null,
    },
    goal_count_target: {
      type: Number,
      default: null,
    },
    schedule: {
      fixed_time_for_all_days: {
        type: Boolean,
        default: true,
      },
      default_time: {
        type: String,
        default: null,
      },
      days: {
        type: [scheduleDaySchema],
        validate: {
          validator: (arr) => arr.length <= 7,
          message: 'schedule.days لازم يكون 7 عناصر كحد أقصى',
        },
      },
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);


habitSchema.pre('validate', function (next) {
  if (this.goal_type === 'duration' && !this.goal_duration_seconds) {
    return next(new Error('goal_duration_seconds مطلوب لما goal_type يكون duration'));
  }
  if (this.goal_type === 'count' && !this.goal_count_target) {
    return next(new Error('goal_count_target مطلوب لما goal_type يكون count'));
  }
  next();
});

const Habit = mongoose.model('Habit', habitSchema);

module.exports = { Habit, DAY_OF_WEEK };