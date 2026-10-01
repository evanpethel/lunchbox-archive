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
        const listing = await prisma.post.findUnique({
            where: { AND: [{id: selectedId}, {status: "listed"}] },
        });

        return { listing };
    },
};
