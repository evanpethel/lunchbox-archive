import { Router } from "express";
import { ListingService } from "../services/listing.service.js";

const router = Router();





router.post("/listings", async (req, res) => {

    try {

        const { title, description, price, photoUrl, age, condition, maker, sellerID } = req.body;
        const listing = await ListingService.publish({ title, description, price, photoUrl, age, condition, maker, sellerID });
        res.status(201).json(listing);

    } catch (err) {


        res.status(400).json({
            error: { code: err.code || "VALIDATION_ERROR", message: err.message },
        });
    }
});

router.get("/listings", async (req, res, next) => {

    try {
        const page = Number(req.query.page) || 1;

        const result = await ListingService.listListed({ page });
        res.status(200).json(result);

    } catch (err) {

        next(err);
    }
});

router.get("/listings/:id", async (req, res) => {

    const { id } = req.params;

    try {

        const result = await ListingService.getListing({ id }); 
        res.status(200).json(result);

    } catch (err) {

        if (err instanceof ListingNotFoundError) {
            return res.status(404).json({ error: { code: "LISTING_NOT_FOUND", message: "Listing not found." }
            });
        }

    }
});

router.put("/listings/:id", async (req, res) => {

    const { id } = req.params;

    const { title, description, price, photoUrl, age, condition, maker, sellerID } = req.body;

    try {
        
        const result = await ListingService.editListing({ id, title, description, price, photoUrl, age, condition, maker, sellerID });
        
        res.status(200).json(result);


    } catch (err) {


    }
});

router.delete("/listings/:id", async (req, res) => {
    
    const { id } = req.params;

    try {
        const result = await ListingService.deleteListing({ id });
        res.status(204).json(result);

    } catch (err) {


    }
});


router.post("/listings/:id/buy", async (req, res) => { 
    
    const { id } = req.params;

    try {

        const result = await ListingService.purchaseListing({ id });
        res.status(200).json(result);

    } catch {}
});




export default router;
