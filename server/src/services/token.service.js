import jwt from "jsonwebtoken";

// No insecure fallbacks: if a secret is missing, the server refuses to start
// instead of silently signing tokens with a publicly known default.
// (index.js imports "dotenv/config" first, so .env is loaded before this runs.)
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const ACCESS_TOKEN_SECRET = requireEnv("ACCESS_TOKEN_SECRET");
const REFRESH_TOKEN_SECRET = requireEnv("REFRESH_TOKEN_SECRET");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
const ALGORITHM = "HS256";

export const TokenService = {
    issueTokens(user) {
        const payload = { sub: user.id, username: user.username };

        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
            algorithm: ALGORITHM,
            expiresIn: ACCESS_TOKEN_TTL,
        });

        const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
            algorithm: ALGORITHM,
            expiresIn: REFRESH_TOKEN_TTL,
        });

        return { accessToken, refreshToken };
    },

    // Pinning the algorithm stops a token from choosing its own (e.g. "none").
    verifyAccessToken(token) {
        return jwt.verify(token, ACCESS_TOKEN_SECRET, { algorithms: [ALGORITHM] });
    },

    verifyRefreshToken(token) {
        return jwt.verify(token, REFRESH_TOKEN_SECRET, { algorithms: [ALGORITHM] });
    },
};
