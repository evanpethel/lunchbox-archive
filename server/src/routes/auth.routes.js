import { Router } from "express";
import { AuthService, UsernameAlreadyRegisteredError, WeakPasswordError, InvalidCredentialsError } from "../services/auth.service.js";

const router = Router();

router.post("/auth/register", async (req, res) => {

    try {

        const result = await AuthService.register(req.body);
        res.status(201).json(result);

    } catch (err) {

        if (err instanceof UsernameAlreadyRegisteredError) {
            return res.status(400).json({ error: { code: "USERNAME_ALREADY_REGISTERED", message: "Username already taken." } });
        }

        if (err instanceof WeakPasswordError) {
            return res.status(400).json({ error: { code: "WEAK_PASSWORD", message: "Password does not meet strength requirements." } });
        }

        res.status(400).json({ error: { code: err.code || "VALIDATION_ERROR", message: err.message } });
    }
});

router.post("/auth/login", async (req, res) => {

    try {

        const result = await AuthService.login(req.body);
        res.status(200).json(result);

    } catch (err) {

        if (err instanceof InvalidCredentialsError) {
            return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password." } });
        }

        res.status(400).json({ error: { code: "BAD_REQUEST", message: err.message } });
    }
});

export default router;