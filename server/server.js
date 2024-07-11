import express from "express";
import * as path from "path";
import { fileURLToPath } from "url";
import router from "./api/routes.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Static single page SolidJS app
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "dist")));
app.get("/", (request, response) => {
    response.sendFile(path.join(path.dirname(fileURLToPath(import.meta.url)), "dist", "index.html"));
});

// API
app.use("/api", router);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});