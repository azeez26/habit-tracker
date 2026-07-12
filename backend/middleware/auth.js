import jwt from "jasonwebtoken"
import User from "../models/User.js"
import catchAsync from "../utils/catchAsync.js"

export const protect = catchAsync(async (req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startWith("Bearer ")){
        token = req.headers.authorization.split(" ")[1]
    }
    if(!token){
        return res.status(401).json({success: false, message:"Not authorized, no token"})
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    req.user = user;
    next()
})