import jwt from "jsonwebtoken"
import User from "../models/User.js"
import catchAsync from "../utils/catchAsync.js"
import appError from "../utils/appError.js"

export const protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1]
    }
    if (!token) {
        return next(new appError("You are not logged in! Please log in to get access.", 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
        return next(new appError("The user belonging to this token no longer exists.", 401));
    }

    req.user = user;
    next()
})
