import { ListingRepository } from "../repositories/listing.repository.js";
import { assertNonEmpty, assertPositiveNumber } from "../utils/validation.js";

class ListingNotFoundError extends Error {}
class ListingAlreadySoldError extends Error {}
class ListingForbiddenError extends Error {}

// Loads a listing (any status) and verifies the caller owns it.
// Throws NotFound if it doesn't exist, Forbidden if someone else owns it.
async function getOwnedListing({ id, userId }) {
    const { listing } = await ListingRepository.findById({ id });

    if (!listing) {
        throw new ListingNotFoundError();
    }
    if (listing.sellerId !== userId) {
        throw new ListingForbiddenError();
    }
    return listing;
}

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

    async editListing({ id, userId, title, description, price, photoUrl, age, condition, maker }) {

        assertNonEmpty(id, "id", "MISSING_ID");
        await getOwnedListing({ id, userId });

        return ListingRepository.editListingById({
            targetId: id, title, description, price, photoUrl, age, condition, maker,
        });
    },

    async deleteListing({ id, userId }) {

        assertNonEmpty(id, "id", "MISSING_ID");
        await getOwnedListing({ id, userId });

        return ListingRepository.deleteListingById({ targetListing: id });
    },

    async purchaseListing({ id, buyerId }) {

        assertNonEmpty(id, "id", "MISSING_ID");

        // The repository does this as a single conditional update, so two
        // simultaneous buyers can't both succeed.
        const { sold } = await ListingRepository.purchase({ targetId: id, buyerId });

        if (!sold) {
            throw new ListingAlreadySoldError();
        }

        return { id, status: "sold", soldTo: buyerId };
    },
};

export { ListingNotFoundError, ListingAlreadySoldError, ListingForbiddenError };
