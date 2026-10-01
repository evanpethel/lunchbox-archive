import { ListingRepository } from "../repositories/post.repository.js";
import { assertNonEmpty } from "../utils/validation.js";

export const ListingService = {
    publish({ title, description, price, photoUrl, age, condition, maker, sellerID }) {
        assertNonEmpty(title, "title", "MISSING_TITLE");
        assertNonEmpty(price, "price", "MISSING_PRICE");

        return ListingRepository.create({
            id,
            title,
            description,
            price,
            photoUrl,
            age,
            contition,
            maker,
            status: "listed",
            sellerId,
        });
    },

    async listListed({ page = 1, pageSize = 10 }) {
        const { listings, hasMore } = await ListingRepository.findListing({ page, pageSize });
        return { listings, page, hasMore };
    },
};
