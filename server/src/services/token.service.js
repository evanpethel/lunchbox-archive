import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET |
| "dev-access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET
|| "dev-refresh-secret";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

export const TokenService = {
    issueTokens(user) {
        const payload = { sub: user.id, username: user.username };

        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
            expiresIn: ACCESS_TOKEN_TTL,
        });

        const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
            expiresIn: REFRESH_TOKEN_TTL,
        });

        return { accessToken, refreshToken };
    },

    verifyAccessToken(token) {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    },

    verifyRefreshToken(token) {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    },
};
