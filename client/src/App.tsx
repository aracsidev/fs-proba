import type { Component } from "solid-js";
import { createEffect, createSignal, For } from "solid-js";
import { createStore } from "solid-js/store";
import "./css/main.css";

enum ordering {
    EPISODE_ASC  = 1,
    EPISODE_DESC = 2,
    DATE_ASC     = 3,
    DATE_DESC    = 4,
    TITLE_ASC    = 5,
    TITLE_DESC   = 6
}

const App: Component = () => {

    // Page signals & store
    const [page, setPage] = createStore<{ pages: number, episodes: {ep_id: number, title: string, date: string, episode: string, characters: {ch_id: number, name: string}[]}[]}>({pages: 0, episodes: []});
    const [currentPage, setCurrentPage] = createSignal<number>(1);
    const [numOfPages, setNumOfPages] = createSignal<number>(1);
    // Popup signals
    const [popupData, setPopupData] = createSignal<{episode: string, characters: {ch_id: number, name: string}[]}>({episode: "", characters: []});
    const [popupShown, setPopupShown] = createSignal<boolean>(false);
    // Filtering and ordering signals
    const [orderType, setOrderType] = createSignal<ordering>(ordering.EPISODE_ASC);
    const [titleFilter, setTitleFilter] = createSignal<string>("");
    const [fromFilter, setFromFilter] = createSignal<number>(0);
    const [toFilter, setToFilter] = createSignal<number>(Date.now());


    /** Fetches a page through the API based on the currentPage signal */
    async function fetch_page() {
        if (currentPage() !== 0 || currentPage() > numOfPages()) {
            fetch(`/api/page/${currentPage()}/${orderType()}/${fromFilter()}/${toFilter()}/${titleFilter()}`).then(async res => {
                if (res.ok) {
                    const data = await res.json();
                    if (data === null || data.pages === 0 || data.episodes.length === 0) {
                        setPage({pages: 0, episodes: []});
                        return;
                    }

                    data.episodes.forEach(async (episode: {ep_id: number, title: string, date: string, episode: string, characters: {ch_id: number, name: string}[]}) => {
                        episode.characters = await fetch_characters(episode.ep_id);
                    });
                    setPage(data);
                } else {
                    console.error(res.status);
                }
            });
        }
    }

    /** Fetches the number of pages we need from the API based on the "pages" property in the page store */
    async function fetch_num_of_pages() {
        fetch(`/api/num_of_pages/${page.pages}`).then(async res => {
            if (res.ok) {
                setNumOfPages(await res.json());
            } else {
                console.error(res.status);
            }
        });
    }

    /** Fetches a list characters from the API based on an episode id */
    async function fetch_characters(id: number) {
        return fetch(`/api/characters_of_episode/${id}`).then(async res => {
            if (res.ok) {
                return await res.json();
            } else {
                console.error(res.status);
            }
        });
    }




    function nextPage() {
        if (currentPage() >= numOfPages()) {
            console.log("Already on last page.");
            return;
        }
        setCurrentPage(currentPage() + 1);
    }

    function previousPage() {
        if (currentPage() <= 1) {
            console.log("Already on first page.");
            return;
        }
        setCurrentPage(currentPage() - 1);
    }

    function openPopup(listOfCharacters: {ch_id: number, name: string}[], episode: string) {
        // Set it the clicked episode -- overwrites previous and rerenders
        setPopupData({episode: episode, characters: listOfCharacters});
        // Does nothing if already open
        setPopupShown(true);
    }

    function closePopup() {
        setPopupShown(false);
    }

    /** Converting from UNIX timestamp to YYYY.MM.DD */
    function convertDate(timestamp: string) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth()+1 < 10 ? `0${date.getMonth()+1}` : `${date.getMonth()+1}`;
        const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
        return `${year}.${month}.${day}`;
    }

    /** Sets the titleFilter signal */
    function filterName(value: string) {
        setCurrentPage(1);
        setTitleFilter(value);
    }

    /** Sets the fromFilter signal */
    function filterFrom(value: string) {
        if (value === "") {
            setFromFilter(0);
        }

        // Only runs once a valid string is provided
        const parsed = value.match(/^(20)[0-9]{2}.(0[1-9]|1[0,1,2]).(0[1-9]|[1,2][0-9]|3[0,1])$/gm);
        if (parsed !== null && parsed[0] !== null) {
            setCurrentPage(1);
            setFromFilter(Date.parse(parsed[0]));
        }
    }

    /** Sets the toFilter signal */
    function filterTo(value: string) {
        if (value === "") {
            setToFilter(Date.now());
        }

        // Only runs once a valid string is provided
        const parsed = value.match(/^(20)[0-9]{2}.(0[1-9]|1[0,1,2]).(0[1-9]|[1,2][0-9]|3[0,1])$/gm);
        if (parsed !== null && parsed[0] !== null) {
            setCurrentPage(1);
            setToFilter(Date.parse(parsed[0]));
        }
    }




    // createEffect runs when anything inside it changes
    createEffect(async () => {
        fetch_page();
        fetch_num_of_pages();
    });

    return (
        <div class='episodes'>
            <div class="episodes-title">
                <h4>Episodes (page {currentPage()}/{numOfPages()})</h4>
                <div class="episodes-title-container">
                    <button onClick={previousPage}>PREVIOUS PAGE</button>
                    <button onClick={nextPage}>NEXT PAGE</button>
                </div>
            </div>
            <div class="filters">
                <input type="text" onInput={(e) => {filterName(e.target.value)}} placeholder="Title"/>
                <input type="text" onInput={(e) => {filterFrom(e.target.value)}} placeholder="Date from"/>
                <input type="text" onInput={(e) => {filterTo(e.target.value)}} placeholder="Date to"/>
                <p>Format: YYYY.MM.DD</p>
            </div>
            <div class="episode episodes-bar">
                <p onClick={() => {orderType() === ordering.TITLE_ASC   ? setOrderType(ordering.TITLE_DESC)   : setOrderType(ordering.TITLE_ASC)}}   >Title</p>
                <p onClick={() => {orderType() === ordering.DATE_ASC    ? setOrderType(ordering.DATE_DESC)    : setOrderType(ordering.DATE_ASC)}}    >Aired</p>
                <p onClick={() => {orderType() === ordering.EPISODE_ASC ? setOrderType(ordering.EPISODE_DESC) : setOrderType(ordering.EPISODE_ASC)}} >Episode</p>
            </div>
            <div class="popup" style={{display: `${popupShown() ? "flex" : "none"}`}}>
                <div class="popup-title">
                    <h4>Characters {popupData().episode}</h4>
                    <button onClick={closePopup}>Close</button>
                </div>
                <For each={popupData().characters}>
                    {(character) => {
                        return (<p>{character.name}</p>);
                    }}
                </For>
            </div>
            <For each={page.episodes} fallback={<p>No episodes matched.</p>}>
                {(episode) => {
                    return (
                        <div class='episode' onClick={() => openPopup(episode.characters, episode.episode)}>
                            <p>{episode.title}</p>
                            <p>{convertDate(episode.date)}</p>
                            <p>{episode.episode}</p>
                        </div>
                    );
                }}
            </For>
        </div>
    );
};

export default App;
