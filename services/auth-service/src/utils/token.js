import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) =>
    jwt.sign(
        {
            userId: user._id,
            role: user.role,
            service: 'auth-service'
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

export const generateRefreshToken = () =>
    crypto.randomBytes(40).toString("hex");
