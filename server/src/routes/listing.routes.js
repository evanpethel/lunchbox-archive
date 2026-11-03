import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    ListingService,
    ListingNotFoundError,
    ListingForbiddenError,
    ListingAlreadySoldError,
} from "../services/listing.service.js";
import { ValidationError } from "../utils/validation.js";

const router = Router();

// Maps known errors to HTTP responses. Anything unexpected becomes a generic 500
// so database or internal error text never reaches the client.
function handleError(err, res) {
    if (err instanceof ListingNotFoundError) {
        return res.status(404).json({ error: { code: "LISTING_NOT_FOUND", message: "Listing not found." } });
    }
    if (err instanceof ListingForbiddenError) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not own this listing." } });
    }
    if (err instanceof ListingAlreadySoldError) {
        return res.status(409).json({ error: { code: "ALREADY_SOLD", message: "Listing is no longer available." } });
    }
    if (err instanceof ValidationError) {
        return res.status(400).json({ error: { code: err.code || "VALIDATION_ERROR", message: err.message } });
    }
    console.error(err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong." } });
}

// ---- Public routes ----

router.get("/listings", async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const result = await ListingService.listListed({ page });
        res.status(200).json(result);
    } catch (err) {
        handleError(err, res);
    }
});

router.get("/listings/:id", async (req, res) => {
    try {
        const result = await ListingService.getListing({ id: req.params.id });
        res.status(200).json(result);
    } catch (err) {
        handleError(err, res);
    }
});

// ---- Authenticated routes ----

router.post("/listings", requireAuth, async (req, res) => {
    try {
        // sellerId is deliberately NOT read from the request body.
        const { title, description, price, photoUrl, age, condition, maker } = req.body;
        const listing = await ListingService.publish({
            title, description, price, photoUrl, age, condition, maker,
            sellerId: req.user.id,
        });
        res.status(201).json(listing);
    } catch (err) {
        handleError(err, res);
    }
});

router.put("/listings/:id", requireAuth, async (req, res) => {
    try {
        const { title, description, price, photoUrl, age, condition, maker } = req.body;
        const result = await ListingService.editListing({
            id: req.params.id,
            userId: req.user.id,
            title, description, price, photoUrl, age, condition, maker,
        });
        res.status(200).json(result);
    } catch (err) {
        handleError(err, res);
    }
});

router.delete("/listings/:id", requireAuth, async (req, res) => {
    try {
        await ListingService.deleteListing({ id: req.params.id, userId: req.user.id });
        res.status(204).end();
    } catch (err) {
        handleError(err, res);
    }
});

router.post("/listings/:id/buy", requireAuth, async (req, res) => {
    try {
        const result = await ListingService.purchaseListing({
            id: req.params.id,
            buyerId: req.user.id,
        });
        res.status(200).json(result);
    } catch (err) {
        handleError(err, res);
    }
});

export default router;
