import { prisma } from "../db/client.js";

export const ListingRepository = {
    create({ title, description, price, photoUrl, age, condition, maker, status, sellerId }) {
        return prisma.post.create({
            data: { title, description, price, photoUrl, age, condition, maker, status, sellerId },
        });
    },

    async findListed({ page, pageSize }) {
        const rows = await prisma.post.findMany({
            where: { status: "listed" },
            orderBy: { id: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize + 1, // fetch one extra row to compute hasMore
        });

        const hasMore = rows.length > pageSize;

        return { listings: rows.slice(0, pageSize), hasMore };
    },

    async findListing({ selectedId }) {
        const listing = await prisma.post.findFirst({
            where: { id: selectedId, status: "listed" },
        });

        return { listing };
    },

    async editListingById({ targetId, title, description, price, photoUrl, age, condition, maker }) {

        const listing = await prisma.post.update({
            where: { id: targetId },
            data: { title, description, price, photoUrl, age, condition, maker },
        });

        return { listing };
    },

    async deleteListingById({ targetListing }) {

        const listing = await prisma.post.delete({
            where: { id: targetListing },
        });

        return { listing };
    },

    async purchase({ targetId }) {

        const result = await prisma.post.updateMany({
            where: { id: targetId, status: "listed" },
            data: { status: "sold" },
        });

        // result.count is 0 if no row matched (already sold, or doesn't exist) —
        // this is what makes the buy action safe against two simultaneous requests
        return { sold: result.count > 0 };
    },
};