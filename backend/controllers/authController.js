import jwt from "jsonwebtoken";
import User from "../models/User.js"
import catchAsync from "../utils/catchAsync.js"
import appError from "../utils/appError.js"

// Helper to sign JWT
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Register new user
export const register = catchAsync(async (req, res,next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return next(new appError("Please provide all fields", 400));
    }
    if (password.length < 6) {
        return next(new appError("Password must be at least 6 characters", 400));
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new appError("Email already registered", 400));
    }

    const user = await User.create({ name, email, password, avatar: name[0].toUpperCase() });
    const token = signToken(user._id);

    res.status(201).json({ user, token });
})

// Login user
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({email});
    
    if (user && (await user.matchPassword(password))) {
        const token = signToken(user._id);
        res.json({ user, token });
    } else {
        return next(new appError("Invalid email or password", 401));
    }
});

// Get current user
export const me = async (req, res) => {
    res.json(req.user);
};

// Update profile
export const updateProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.morningMotivation = req.body.morningMotivation !== undefined ? req.body.morningMotivation : user.morningMotivation;

        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        return next(new appError("User not found", 404));
    }
})