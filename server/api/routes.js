import express from "express";
import { get_num_of_pages, get_page, get_episode_characters } from "../database.js";

const router = express.Router();

router.get("/page/:id/:type/:fromFilter/:toFilter/:nameFilter?", async (request, response) => {
    const id         = Number(request.params.id);
    const type       = Number(request.params.type);
    const fromFilter = Number(request.params.fromFilter);
    const toFilter   = Number(request.params.toFilter);
    let nameFilter   = request.params.nameFilter;
    nameFilter = nameFilter === undefined ? "" : nameFilter;

    if (id < 0 || id > (get_num_of_pages()) || !Number.isInteger(id) ||
        type < 1 || type > 6 || !Number.isInteger(type)) {
        response.json({pages: 1, episodes: []});
    } else {
        response.json(await get_page(id, type, nameFilter, fromFilter, toFilter));
    }
});

router.get("/num_of_pages/:num", async (request, response) => {
    const num = Number(request.params.num);

    if (num < 0 || !Number.isInteger(num)) {
        response.json(0);
    } else {
        response.json(get_num_of_pages(num));
    }
});

router.get("/characters_of_episode/:id", async (request, response) => {
    const id = Number(request.params.id);

    if (id <= 0 || !Number.isInteger(id)) {
        response.json(0);
    } else {
        response.json(await get_episode_characters(id));
    }
});

export default router;