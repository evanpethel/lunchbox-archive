import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/user.repository.js";
import { assertNonEmpty, ValidationError } from "../utils/validation.js";
import { TokenService } from "./token.service.js";

class UsernameAlreadyRegisteredError extends Error {}
class WeakPasswordError extends Error {}
class InvalidCredentialsError extends Error {}

const MIN_PASSWORD_LENGTH = 8;

export const AuthService = {
    async register({ username, password }) {
        assertNonEmpty(username, "username", "MISSING_DISPLAY_NAME");
        assertNonEmpty(password, "password", "MISSING_PASSWORD");

        const existing = await UserRepository.findByUsername(username);

        if (existing) {
            throw new UsernameAlreadyRegisteredError();
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            throw new WeakPasswordError();
        }

        const passwordHash = await bcrypt.hash(password, 10);

        let user;

        try {
            user = await UserRepository.create({ username, passwordHash });
        } catch (err) {
        // Defense in depth (Lecture 4): the DB's @unique
        // constraint may reject a race-condition duplicate that slipped
        // past the check above.
            throw new UsernameAlreadyRegisteredError();
        }
        const tokens = TokenService.issueTokens(user);
        return { user, ...tokens };
    },

    async login({ username, password }) {
        const user = await UserRepository.findByUsername(username);

        if (!user) {
            throw new InvalidCredentialsError();
        }

        const matches = await bcrypt.compare(password, user.passwordHash);

        if (!matches) {
            throw new InvalidCredentialsError();
        }

        const tokens = TokenService.issueTokens(user);

        return { user, ...tokens };
    },
};

export { UsernameAlreadyRegisteredError, WeakPasswordError, InvalidCredentialsError, ValidationError };
