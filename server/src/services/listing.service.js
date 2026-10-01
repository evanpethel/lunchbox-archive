import { ListingRepository } from "../repositories/listing.repository.js";
import { assertNonEmpty, assertPositiveNumber } from "../utils/validation.js";

class ListingNotFoundError extends Error {}
class ListingAlreadySoldError extends Error {}

export const ListingService = {

    publish({ title, description, price, photoUrl, age, condition, maker, sellerId }) {
        assertNonEmpty(title, "title", "MISSING_TITLE");
        assertPositiveNumber(price, "price", "MISSING_PRICE");

        return ListingRepository.create({
            title,
            description,
            price,
            photoUrl,
            age,
            condition,
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

        const { listing } = await ListingRepository.findListing({ selectedId: id });

        if (!listing) {
            throw new ListingNotFoundError();
        }

        return listing;
    },

    async editListing({ id, title, description, price, photoUrl, age, condition, maker }) {

        assertNonEmpty(id, "id", "MISSING_ID");
        assertPositiveNumber(price, "price", "MISSING_PRICE");

        return ListingRepository.editListingById({ targetId: id, title, description, price, photoUrl, age, condition, maker });
    },

    async deleteListing({ id }) {

        assertNonEmpty(id, "id", "MISSING_ID");

        return ListingRepository.deleteListingById({ targetListing: id });
    },

    async purchaseListing({ id }) {

        assertNonEmpty(id, "id", "MISSING_ID");

        const { sold } = await ListingRepository.purchase({ targetId: id });

        if (!sold) {
            throw new ListingAlreadySoldError();
        }

        return { id, status: "sold" };
    },
};

export { ListingNotFoundError, ListingAlreadySoldError };