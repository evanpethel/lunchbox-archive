import { Router } from "express";
import { ListingService } from "../services/listing.service.js";

const router = Router();

router.get("/listings", async (req, res, next) => {

    try {
        const page = Number(req.query.page) || 1;

        const result = await ListingService.listListed({ page });
        res.status(200).json(result);

    } catch (err) {

        next(err);
    }
});

router.get("/listings/:id", async (req, res, next) => {

    try {

        const result = await ListingService.listListing({ id }); 
        res.status(200).json(result);

    } catch (err) {


    }
});


router.post("/listings", async (req, res) => {

    try {

        const { title, description, price, photoUrl, age, condition, maker, sellerID } = req.body;
        const post = await ListingService.publish({ title, description, price, photoUrl, age, condition, maker, sellerID });
        res.status(201).json(post);

    } catch (err) {

        res.status(400).json({
            error: { code: err.code || "VALIDATION_ERROR", message: err.message },
        });
    }
});

export default router;
