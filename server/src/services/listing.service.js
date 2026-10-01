import { ListingRepository } from "../repositories/post.repository.js";
import { assertNonEmpty } from "../utils/validation.js";

class ListingNotFoundError extends Error {}

export const ListingService = {

    publish({ title, description, price, photoUrl, age, condition, maker }) {

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
        const { listings, hasMore } = await ListingRepository.findListed({ page, pageSize });
        return { listings, page, hasMore };
    },

    async getListing({ id }) {

        assertNonEmpty(id, "id", "MISSING_ID");

        return ListingRepository.findListing({ id });
    },

    async editListing ({ id, title, description, price, photoUrl, age, condition, maker }) {

        assertNonEmpty(id, "id", "MISSING_ID");

        return ListingRepository.editListingById({ id })
    },

    async deleteListing({ id }) {
        
        assertNonEmpty(id, "id", "MISSING_ID");

        return ListingRepository.deleteListingById({ id });
    },

    async purchaseListing({ id }) {
        
        assertNonEmpty(id, "id", "MISSING_ID");

        return ListingRepository.purchase({ id });
    },
};

export {ListingNotFoundError};
