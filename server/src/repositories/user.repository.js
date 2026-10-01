import { prisma } from "../db/client.js";

export const UserRepository = {
    findByUsername(username) {
        return prisma.user.findUnique({ where: { username } });
    },
    create({ username, passwordHash }) {
        return prisma.user.create({
            data: { username, passwordHash },
        });
    },
};
