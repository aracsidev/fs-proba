import mysql from "mysql2";
import env from "dotenv";
env.config();

const ITEMS_PER_PAGE = 15;

// Switch for safety
function orderTypes(type) {
    switch (type) {
        case 1:
            return "episode ASC";
        case 2:
            return "episode DESC";
        case 3:
            return "date ASC";
        case 4:
            return "date DESC";
        case 5:
            return "title ASC";
        case 6:
            return "title DESC";
        default:
            return "episode ASC";
    }
}

// Pooling queries
const db = mysql.createPool({
    host:       process.env.SQL_HOST,
    user:       process.env.SQL_USER,
    password:   process.env.SQL_PASSWORD,
    database:   process.env.SQL_DATABASE
}).promise(); // Use async instead of callback

// Insert a single episode
export async function insert_episode(id, title, date, episode) {
    const result = await db.query("INSERT INTO episodes (ep_id, title, date, episode) VALUES (?, ?, ?, ?)", [id, title, date, episode]);
    return result;
}

// Insert a single character
export async function insert_character(id, name) {
    const result = await db.query("INSERT INTO characters (ch_id, name) VALUES (?, ?)", [id, name]);
    return result;
}

// Insert a single episode id - character id pair
export async function insert_connection(ep_id, ch_id) {
    const result = await db.query("INSERT INTO episode_characters (ep_id, ch_id) VALUES (?, ?)", [ep_id, ch_id]);
    return result;
}

// Get a page of episodes
export async function get_page(page_number, type, nameFilter, fromFilter, toFilter) {

    const page_index = page_number-1;

    const episodes = await get_all_episodes(type, nameFilter, fromFilter, toFilter);
    const pages = get_num_of_pages(episodes.length);

    if (page_number < 0 || page_number > pages) {
        console.error(`ERR: That page does not exist. (Page ${page_number})`);
        return {pages: 1, episodes: []};
    }

    if (page_number === 0) {
        return {pages: 1, episodes: []};
    }

    const page_data = [];
    for (let i = (page_index*ITEMS_PER_PAGE)+1; i < ((page_index+1)*ITEMS_PER_PAGE)+1; i++) {
        if (i > episodes.length) {
            break;
        }

        page_data.push(episodes[i-1]);
    }

    return {pages: episodes.length, episodes: page_data};
}

// Get the number of pages we need based on episode count
export function get_num_of_pages(episodes) {
    // For the empty page
    if (episodes === 0) return 1;
    // Calculate pages from amount of episodes and ITEMS_PER_PAGE
    return episodes % ITEMS_PER_PAGE === 0 ? episodes / ITEMS_PER_PAGE : Math.floor(episodes / ITEMS_PER_PAGE) + 1;
}

// Get all episodes that fit query
export async function get_all_episodes(type, nameFilter, fromFilter, toFilter) {
    const result = await db.query(`
        SELECT *
        FROM episodes
        ORDER BY ${orderTypes(type)};
    `);

    // Filters
    let ret = [];
    for (let i = 0; i < result[0].length; i++) {

        // Title filter
        if (!result[0][i].title.toLowerCase().includes(nameFilter.toLowerCase())) {
            continue;
        }

        // Date filter
        if (result[0][i].date < fromFilter || result[0][i].date > toFilter) {
            continue;
        }

        ret.push(result[0][i]);
    }

    return ret;
}

// Get a single episode based on id
export async function get_episode(id) {
    const result = await db.query(`
        SELECT *
        FROM episodes
        WHERE episodes.ep_id = ?;
        `, [id]);

    let ret = {
        ep_id:      await result[0][0].ep_id,
        title:      await result[0][0].title,
        date:       await result[0][0].date,
        episode:    await result[0][0].episode,
    }

    return ret;
}

// Get characters in an episode based on the episode id
export async function get_episode_characters(id) {
    const result = await db.query(`
        SELECT characters.*
        FROM episodes
        INNER JOIN episode_characters
        ON episodes.ep_id = episode_characters.ep_id
        INNER JOIN characters
        ON characters.ch_id = episode_characters.ch_id
        WHERE episodes.ep_id = ?;
        `, [id]);

    let ret = [];
    for (let i = 0; i < result[0].length; i++) {
        ret.push({id: await result[0][i].ch_id, name: await result[0][i].name});
    }

    return ret;
}