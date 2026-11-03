import { TokenService } from "../services/token.service.js";

// Requires a valid access token in the "Authorization: Bearer <token>" header.
// On success, sets req.user = { id, username } from the VERIFIED token payload.
// Route handlers must use req.user.id and never trust user ids sent in the body.
export function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: { code: "UNAUTHENTICATED", message: "Authentication required." },
        });
    }

    try {
        const payload = TokenService.verifyAccessToken(token);
        req.user = { id: payload.sub, username: payload.username };
        next();
    } catch {
        // Covers bad signature, malformed token, and expired token alike.
        return res.status(401).json({
            error: { code: "INVALID_TOKEN", message: "Invalid or expired token." },
        });
    }
}
