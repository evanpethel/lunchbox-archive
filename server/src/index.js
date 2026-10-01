import "dotenv/config";
import express from "express";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import listingRoutes from "./routes/listing.routes.js";


const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", listingRoutes);
app.use((err, req, res, next) => {

console.error(err);
    res.status(err.status || 500).json({
        error: { code: err.code || "INTERNAL_ERROR", message: err.message },
    });
});

app.listen(PORT, () => {
    console.log(`Lunchbox API listening on port ${PORT}`);
});
