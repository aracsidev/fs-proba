import https from "https";
import mysql from "mysql2";
import env from "dotenv";
env.config();
import { insert_episode, insert_character, insert_connection } from "./database.js";

const TYPES = {
    EPISODE: 0,
    CHARACTER: 1
}

async function getJSONFromAPI(url, type) {
    return new Promise((resolve, reject) => {
        const get = https.get(url, (response) => {
            let data = "";
            response.on("data", (part) => {
                data += part;
            });
        
            response.on("end", () => {
                try {
                    let json = JSON.parse(data);
                    json = parse(json, type);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", (e) => {
            reject(e);
        });

        get.end();
    });
}

function parse(json, type) {
    const pages = json.info.pages;
    
    let parsed = [];

    if (type === TYPES.EPISODE) {
        for (let i = 0; i < json.results.length; i++) {

            let characters = [];
            for (let j = 0; j < json.results[i].characters.length; j++) {
                characters.push(json.results[i].characters[j].match(/[0-9]*$/gm)[0]);
            }

            parsed.push({
                id:         json.results[i].id,
                title:      json.results[i].name,
                date:       json.results[i].air_date,
                episode:    json.results[i].episode,
                characters: characters
            });
        }
    } else if (type === TYPES.CHARACTER) {
        for (let i = 0; i < json.results.length; i++) {
            parsed.push({
                id:         json.results[i].id,
                name:       json.results[i].name
            });
        }
    }

    return [parsed, pages];
}

async function insert_episodes() {
    const [episodes, pages] = await getJSONFromAPI("https://rickandmortyapi.com/api/episode?page=1", TYPES.EPISODE);

    for (let i = 2; i < pages+1; i++) {
        const [other_ep] = await getJSONFromAPI(`https://rickandmortyapi.com/api/episode?page=${i}`, TYPES.EPISODE);
        for (let j = 0; j < other_ep.length; j++) {
            episodes.push(other_ep[j]);
        }
    }

    for (let i = 0; i < episodes.length; i++) {
        insert_episode(episodes[i].id, episodes[i].title, Number(Date.parse(episodes[i].date)), episodes[i].episode);
        for (let j = 0; j < episodes[i].characters.length; j++) {
            insert_connection(episodes[i].id, episodes[i].characters[j]);
        }
    }
    
    console.log("Fetching data\nThis might take a while...\n");
    console.log("Episodes        ✓");

    return;
}

async function insert_characters() {
    const [characters, pages] = await getJSONFromAPI("https://rickandmortyapi.com/api/character?page=1", TYPES.CHARACTER);

    for (let i = 2; i < pages+1; i++) {
        const [other_ch] = await getJSONFromAPI(`https://rickandmortyapi.com/api/character?page=${i}`, TYPES.CHARACTER);
        for (let j = 0; j < other_ch.length; j++) {
            characters.push(other_ch[j]);
        }
    }

    for (let i = 0; i < characters.length; i++) {
        insert_character(characters[i].id, characters[i].name);
    }

    console.log("Characters      ✓\n");
    console.log("You can now run:");
    console.log("npm run start      - to start the dev server");
    console.log("npm run serve      - to run the server\n");
    console.log("All done, to exit press 'ctrl + c'\n");

    return;
}

function initialize() {

    const connection = mysql.createConnection({
        host:       process.env.SQL_HOST,
        user:       process.env.SQL_USER,
        password:   process.env.SQL_PASSWORD
    });

    connection.query(`CREATE DATABASE rickandmorty;`);
    connection.query(`USE rickandmorty;`);

    connection.query(`
        CREATE TABLE episodes(
            ep_id INT PRIMARY KEY,
            title TEXT,
            date BIGINT,
            episode TEXT
        );
    `);

    connection.query(`
        CREATE TABLE characters(
            ch_id INT PRIMARY KEY,
            name TEXT
        );
    `);

    connection.query(`
        CREATE TABLE episode_characters(
            ep_id INT NOT NULL,
            ch_id INT NOT NULL,
            PRIMARY KEY(ep_id, ch_id)
        );
    `);
    console.log("Creating database...\n");
    console.log("Database schema ✓\n");
    return;
}

initialize();
insert_episodes();
insert_characters();