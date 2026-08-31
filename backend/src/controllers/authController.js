import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import catchAsync from "../utils/catchAsync.js";
import appError from "../utils/appError.js";

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, timezone, language } = req.body;

    const userExists = await User.findOne({ email });
    
    if (userExists) {
        return next(new appError("Email already registered", 400));
    }

    const user = await User.create({ 
        name, 
        email, 
        password, 
        timezone: timezone || 'Africa/Cairo',
        language: language || 'ar'
    });
    
    const token = signToken(user._id);

    res.status(201).json({ 
        success: true,
        user: user.toJSON(), 
        token,
        timezone: user.timezone 
    });
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
        const token = signToken(user._id);
        res.json({ 
            success: true,
            user, 
            token,
            timezone: user.timezone 
        });
    } else {
        return next(new appError("Invalid email or password", 401));
    }
});

export const me = catchAsync(async (req, res, next) => {
    res.json({
        success: true,
        data: req.user.toJSON()
    });
});

export const updateProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new appError("User not found", 404));
    }

    const { name, morningMotivation, timezone } = req.body;

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
            return next(new appError("Name cannot be empty", 400));
        }
        user.name = name.trim();
    }

    if (morningMotivation !== undefined) {
        user.morningMotivation = Boolean(morningMotivation);
    }

    if (timezone !== undefined) {
        if (typeof timezone !== 'string' || timezone.trim() === '') {
            return next(new appError("Timezone cannot be empty", 400));
        }
        user.timezone = timezone.trim();
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
});