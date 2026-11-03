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

    // Public lookup: only returns listings that are still for sale.
    async findListing({ selectedId }) {
        const listing = await prisma.post.findFirst({
            where: { id: selectedId, status: "listed" },
        });

        return { listing };
    },

    // Lookup by id regardless of status; used for ownership checks.
    async findById({ id }) {
        const listing = await prisma.post.findUnique({
            where: { id },
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

    // Atomic: the WHERE includes status = 'listed', so only one of several
    // simultaneous buyers can match the row. count === 0 means already sold
    // (or the listing doesn't exist).
    async purchase({ targetId, buyerId }) {

        const result = await prisma.post.updateMany({
            where: { id: targetId, status: "listed" },
            data: { status: "sold", soldTo: buyerId },
        });

        return { sold: result.count > 0 };
    },
};
