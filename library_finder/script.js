window.onload = () => {
    /*-------------------------------------------------------------------------
        Add DOM elements and styling, initialize state, and set handlers.
    -------------------------------------------------------------------------*/
    const libraryExplorer = document.getElementById('library-explorer');
    const rootInfo = libraryExplorer.children[0].dataset;

    organizeAlbums(libraryExplorer.children[0].children[0]);

    libraryExplorer.getElementsByTagName('UL')[0].classList.add("fade");

    console.log(document.querySelectorAll('.album').length)

    if (document.querySelectorAll) {
        document.querySelectorAll(".library-item").forEach((elem) => {
            insertHoverDetailsBeforeUL(elem, rootInfo);
            const menuButton = document.createElement("span");
            menuButton.innerText = "MENU";
            menuButton.classList.add("library-item-menu-button");
            const span = elem.getElementsByTagName("span")[0];
            elem.insertBefore(menuButton, span)

            styleTheListElement(elem, rootInfo);
        });
        document.querySelectorAll(".largest-folders").forEach((elem) => {
            styleTheListElement(elem, rootInfo);
            elem.appendChild(hoverDetails(elem, rootInfo));
        });
    }

    /*-------------------------------------------------------------------------
        Initialize state.
    -------------------------------------------------------------------------*/
    const state = {
        search: {
            index: {},
            query: "",
            results: [],
            resultsText: "",
            i: 0,
        },
        explorer: {
            hoverPath: "",
            openFolders: new Set
        }
    }

    setTimeout(() => indexForSearch(libraryExplorer, state.search.index), 0);

    /*-------------------------------------------------------------------------
        Initialize listeners.
    -------------------------------------------------------------------------*/
    libraryExplorer.onclick = (e) => {
        updateState({
            type: "FOLDER_CLICK",
            node: e.target
        });
        //document.querySelector("#library-item-modal").classList.remove("show-modal")
    }

    document.onclick = (e) => {
        console.log(e.target.closest("#library-item-modal"))
        if (!e.target.closest("#library-item-modal")) {
            document.querySelector("#library-item-modal").classList.remove("show-modal")
            document.querySelector("#library-item-modal").classList.add("hide-modal")
        }
        // e.stopPropagation();
        // if (e.target.id === "library-item-modal") return;
        // if (e.target.id === "library-item-menu-button") return;
        

    }

    document.querySelector('#library-item-modal').onmouseenter = (e) => {
        //console.log(e.target)
        console.log(state.explorer.openMenu)
        state.explorer.openMenu.classList.add()  
    }

    document.querySelector('#library-item-modal').onclick = (e) => {
        e.stopPropagation() 
    }

    

    libraryExplorer.querySelectorAll(".library-item-menu-button").forEach((node) =>
        node.onclick = (e) => {
            e.stopPropagation();

            updateState({
                type: "CLICK_ITEM_BUTTON",
                node: e.target
            })

            //console.log(e.target.parentElement);
            const menu = document.querySelector("#library-item-modal")
            // menu.classList.toggle("hide-modal")
            // menu.classList.contains("hide-modal") ?
            //     menu.classList.remove("show-modal") :
            //     menu.classList.add("show-modal")
            parentRect = e.target.getBoundingClientRect()
            const top = parentRect.bottom + window.pageYOffset
            const right = window.innerWidth - parentRect.right


            menu.style.top = top + 8 + "px";
            //menu.style.height = "90px"
            menu.style.right = right - 26 + "px";
            //menu.style.width = "900px";

            const menuItems = menu.getElementsByClassName("modal-menu-item");
            const parentData = node.parentElement.dataset
            menuItems[3].children[0].innerText = "Copy full path to clipboard"

            menuItems[0].innerText = parentData.fullPath
            menuItems[0].style.fontSize = 'small';
            menuItems[0].style.visibility = 'hidden'
            menuItems[0].style.display = 'block';
            menuItems[2].style.display = 'none';
            console.log(menuItems[0].offsetWidth)
            menuItems[2].style.width = menuItems[0].offsetWidth + "px";
            menuItems[2].style.display = 'flex';
            menuItems[0].style.visibility = 'visible';
            menuItems[0].style.display = "none";
            menuItems[1].innerText = parentData.shortname
            menuItems[1].style.fontWeight = "bold";


            menuItems[2].innerText = parentData.fullPath

            
            menuItems[3].children[0].onclick = () => {
                menuItems[2].focus();
                menuItems[2].select();
                menuItems[2].setSelectionRange(0, 99999);
                const successful = document.execCommand("copy");
                menuItems[3].children[0].innerText = successful ?
                    "Copied!" :
                    "Copy failed.  Highlight and copy manually."
                
            }
            menuItems[3].children[1].href = "file:///" + parentData.fullPath


            menuItems[4].innerText = ((node) => {
                switch (node.parentElement.classList[0]) {
                    case "library":
                        return "Library";
                    case "collection":
                        return "Collection";
                    case "album":
                        return "Album";
                    case "path":
                        return "Path";
                }
            })(node);
            menuItems[5].innerText = parentData.totalAudioFiles ?
                `${parentData.totalAudioFiles} audio files` :
                "";
            menuItems[6].innerText = parentData.totalAlbums ?
                `${parentData.totalAlbums} albums` :
                "";


        }
    )

    document.getElementById("search-text").onkeyup = (e) => {
        if (e.target.value !== state.search.query) {
            updateState({
                type: "NEW_QUERY",
                text: e.target.value
            })
        };
    }

    document.addEventListener("mouseover", (e) => {
        const text = getFullPath(e);
        updateState({
            type: "CHANGE_HOVER_PATH",
            text: text
        })
    });

    document.getElementById("find-next").onclick = (e) => {
        updateState({ type: "FIND_NEXT" })
    };

    document.getElementById("find-previous").onclick = (e) => {
        updateState({ type: "FIND_PREVIOUS" })
    }

    document.getElementById("insights").onclick = (e) => {
        const node = findFolder(e.target.dataset.fullPath)
        updateUi({
            type: "JUMP_TO_NODE",
            node: node
        })
    }

    libraryExplorer.oncontextmenu = (e) => {
        e.preventDefault();

    }



    /*-------------------------------------------------------------------------
        Handle changes to state.
    -------------------------------------------------------------------------*/
    const updateState = (action) => {
        switch (action.type) {
            case "NEW_QUERY":
                state.search.query = action.text;
                updateState({ type: "NEW_SEARCH" });
                break;
            case "NEW_SEARCH":
                state.search.previousResult = (
                    state.search.results ?
                        state.search.results[state.search.i] : null);
                state.search.results = findAll(state.search.query);
                state.search.resultsText = getSearchResultText(state.search.results);
                state.search.i = 0;
                updateUi({ type: "SCROLL_SEARCH" });
                break;
            case "FIND_NEXT":
                if (state.search.i < state.search.results.length - 1) {
                    state.search.previousResult = (
                        state.search.results ?
                            state.search.results[state.search.i] : null);
                    state.search.i++;
                    state.search.resultsText = getSearchResultText(state.search.results);
                    updateUi({ type: "SCROLL_SEARCH" });
                }
                // if == length disable the up button
                break;
            case "FIND_PREVIOUS":
                if (state.search.i > 0) {
                    state.search.previousResult = (
                        state.search.results ? state.search.results[state.search.i] : null);
                    state.search.i--;
                    state.search.resultsText = getSearchResultText(state.search.results);
                    updateUi({ type: "SCROLL_SEARCH" });
                }
                // if == 0 disable the down button
                break;
            case "CHANGE_HOVER_PATH":
                state.explorer.hoverPath = action.text
                updateUi({ type: "CHANGE_HOVER_PATH" })
                break;
            case "FOLDER_CLICK":
                updateUi({
                    type: "FOLDER_CLICK",
                    node: action.node
                })
                break;
            case "TOGGLE_FOLDER":
                action.open ?
                    state.explorer.openFolders.add(action.node) :
                    state.explorer.openFolders.delete(action.node)
                break;
            case "CLICK_ITEM_BUTTON":
                updateUi({
                    type: "CLICK_ITEM_BUTTON",
                    node: action.node.parentElement
                })
                break;
            case "CHANGE_ITEM_MENU_OPEN":
                state.explorer.openMenu = action.node;
            default:
                return;
        }
    }

    /*-------------------------------------------------------------------------
        Handle changes to UI state.
    -------------------------------------------------------------------------*/
    const updateUi = (action) => {
        switch (action.type) {
            case "SCROLL_SEARCH":
                ui_ScrollSearch();
                break;
            case "CHANGE_HOVER_PATH":
                ui_ChangeHoverPath();
                break;
            case "FOLDER_CLICK":
                const state = ui_ToggleFolder(action.node)
                updateState({
                    type: "TOGGLE_FOLDER",
                    open: state,
                    node: action.node
                })
                break;
            case "JUMP_TO_NODE":
                ui_JumpToNode(action.node)
                break;
            case "CLICK_ITEM_BUTTON":
                const visible = document.getElementById("library-item-modal").classList.contains("show-modal");
                if (visible) {
                    document.getElementById("library-item-modal").classList.add("hide-modal");
                    document.getElementById("library-item-modal").classList.remove("show-modal");
                    updateState({
                        type: "CHANGE_ITEM_MENU_OPEN",
                        node: null
                    })
                } else {
                    document.getElementById("library-item-modal").classList.remove("hide-modal");
                    document.getElementById("library-item-modal").classList.add("show-modal");
                    updateState({
                        type: "CHANGE_ITEM_MENU_OPEN",
                        node: action.node
                    })
                }
        }
    }

    /*-------------------------------------------------------------------------
        UI functions for interacting with DOM.
    -------------------------------------------------------------------------*/
    const ui_ToggleFolder = (node) => {
        return dropDownDirectory(node);
    }


    const ui_ChangeHoverPath = () => {
        document.getElementById("full-path-display").innerText = state.explorer.hoverPath
    }

    const ui_ScrollSearch = () => {
        const node = state.search.results[state.search.i]
        nodes = getParentsOfNode(node)
        hideStaleNodes(nodes);
        showFreshNodes(nodes);
        scrollToNode(node);
        //flashNode(node);
        displaySearchResults();
        if (state.search.previousResult) state.search.previousResult.classList.remove('current-search-result')
        if (node) node.classList.add('current-search-result')
    }

    const ui_JumpToNode = (node) => {
        nodes = getParentsOfNode(node)
        hideStaleNodes(nodes);
        showFreshNodes(nodes);
        scrollToNode(node);
        flashNode(node);
    }

    const displaySearchResults = () => {
        document.getElementById("search-results").
            innerText = state.search.resultsText;
    }

    const getSearchResultText = (results) => {
        if (!state.search.query) {
            return "";
        }
        else if (results.length <= 0) {
            return `No results for "${state.search.query}"`
        }
        else {
            return `${state.search.i + 1} / ${results.length}`
        }
    }

    const findAll = searchIndex(state.search.index)

}

/*-----------------------------------------------------------------------------
    Utility functions.
-----------------------------------------------------------------------------*/
const searchIndex = (index) => (query) => {
    if (query == " ") return [];
    lower = query.toLowerCase();
    const words = lower.split(" ")
        .filter((word) => word !== "")
        .filter((word) => word !== " ");
    const searchResults = [];
    const orderedResults = new Array(words.length + 1)
    countHits = new Object;

    for (i = 0; i < words.length; i++) {
        if (!index[words[i]]) continue;
        for (const node of index[words[i]]) {
            key = node.dataset.fullPath
            if (!countHits[key]) countHits[key] = 0;
            countHits[key]++;
            searchResults.push(node);
        }
    }

    for (const node of searchResults) {
        const hits = countHits[node.dataset.fullPath]
        if (!orderedResults[hits]) orderedResults[hits] = new Set;
        orderedResults[hits].add(node)
    }

    completeResults = [];
    for (i = words.length + 1; i >= 1; i--) {
        if (!orderedResults[i]) continue;
        for (const node of orderedResults[i].values()) {
            completeResults.push(node);
        }
    }
    return completeResults;
}

const indexForSearch = (node, index) => {
    const indexNext = (node) => {
        if (node.dataset.shortname) {

            const keywords = node.dataset.shortname.toLowerCase().split(" ")

            keywords.forEach((keyword) => {
                if (index[keyword] !== undefined) index[keyword].add(node);
                else {
                    index[keyword] = new Set;
                    index[keyword].add(node)
                }
            })

            //console.log(entry)
        }
        for (let child of node.children) {
            indexNext(child)
        }
    }
    indexNext(node)
    return index;
}

const findFolder = (fullPath) => {
    for (const node of document.querySelectorAll(".library-item")) {
        if (node.dataset.fullPath === fullPath) return node;
    }
}

const getParentsOfNode = (node) => {
    if (!node) return new Set;
    let nodeCursor = node.parentElement;
    const nodeParents = new Set;

    while (nodeCursor) {
        if (nodeCursor.tagName === "UL") nodeParents.add(nodeCursor);
        nodeCursor = nodeCursor.parentElement;
    }
    return nodeParents;
}

const hideStaleNodes = (setOfNodes) => {
    const currentShownNodes = new Set;
    const shownNodes = document.getElementById('library-explorer')
        .getElementsByClassName('show-list')

    for (const shownNode of shownNodes) {
        currentShownNodes.add(shownNode);
    };

    const stale = [...currentShownNodes].filter((node) => {
        return !setOfNodes.has(node);
    })

    for (const node of stale) {
        node.classList.remove('show-list')
    }
    return stale;
}

const showFreshNodes = (setOfNodes) => {
    for (const node of setOfNodes) {
        node.classList.add('show-list')
    }
    return setOfNodes
}

const scrollToNode = (node) => {
    if (!node) return;
    window.requestAnimationFrame(() => node.scrollIntoView({
        behavior: "smooth",
        block: "center",
    }));
}

const flashNode = (node) => {
    if (!node) return;
    setTimeout(
        () => node.style.background = node.dataset.backgroundColor, 5000)
    node.style.backgroundColor = "white";
}

const highlightNode = (node) => {
    if (!node) return;
    let newColor = node.dataset.backgroundColor.slice(0, node.dataset.backgroundColor.length - 2);
    newColor = newColor + ".1)";
    node.style.backgroundColor = newColor;
}

const getFullPath = (e) => {
    elem = e.target;
    if (!elem.classList.contains("library-item")) return "";
    return elem.dataset.fullPath;
}

/**
 * Add the class "show-list".
 * @param {Event} e.target The target node.
 */
const dropDownDirectory = (node) => {
    const toggleShowList = toggleClassName('show-list')
    let state;
    for (const child of node.children) {
        if (child === undefined) continue;
        toggleShowList(child);
        state = child.classList.contains('show-list')
    };
    return state;
}

/**
 * Returns a function that toggles the class name on and off.
 * @param {String} className The class name to toggle on and off.
 */
const toggleClassName = (className) => (element) => {
    return element.classList.toggle(className);
}

/**
 * Style the (list) element. Requires rootInfo.totalAlbums and that the
 * element have its class and dataset attributes set correctly.
 * elem.dataset.totalAlbums: Number
 * @param {HTMLElement} elem The HTML node element.
 * @param {Object} rootInfo The info about the displayed directories.
 */
const styleTheListElement = (elem, rootInfo) => {

    if (elem.classList.contains("album")) {
        const backgroundColor = `rgba(255, 240, 230)`

        elem.style.backgroundColor = backgroundColor;
        elem.style.borderColor = `rgba(230, 200, 200)`;

        elem.dataset.backgroundColor = backgroundColor;
        return;
    }

    const albums = elem.dataset.totalAlbums;

    const minPercent = .002;
    const percent = Math.max(albums / rootInfo.totalAlbums, minPercent);
    const green = (255 - 255 * Math.log2(percent)) * 0.1;
    const blue = (200 - .5 * green);
    const red = 255;

    const backgroundColor = `rgba(${red}, ${green}, ${blue}, 1)`

    elem.style.backgroundColor = backgroundColor;
    elem.style.borderColor =
        `rgba(${red - 100}, ${green + 50}, ${blue + 200}, 1)`

    elem.dataset.backgroundColor = backgroundColor;
}

/**
 * Insert the hover details for the element.
 * @param {HTMLElement} elem The HTML node element.
 */
const insertHoverDetailsBeforeUL = (elem) => {
    const ul = elem.getElementsByTagName("UL")[0];
    elem.insertBefore(hoverDetails(elem), ul)
}

/**
 * Takes an <li> and formats its attributes. Returns a new <span> to be 
 * appended under the <li>.
 * @param {HTMLElement} li The <li> that needs hover details added.
 */
const hoverDetails = (li, rootInfo) => {
    const newSpan = document.createElement("span");
    let text;
    if (li.classList.contains("library")) {
        text =
            `${li.dataset.totalAlbums} albums, ` +
            `${li.dataset.totalAudioFiles} tracks`;
    }
    else if (li.classList.contains("collection")) {
        text =
            `${li.dataset.totalAlbums} albums, ` +
            `${li.dataset.totalAudioFiles} tracks`;
    }
    else if (li.classList.contains("album")) {
        text =
            `${li.dataset.containedAudioFiles} tracks`;
    }
    else if (li.classList.contains("path")) {
        text =
            `${li.dataset.totalAlbums} albums, ` +
            `${li.dataset.totalAudioFiles} tracks`;
    }
    else if (li.classList.contains("largest-folders")) {
        text =
            `${li.dataset.totalAlbums} albums ` +
            `(${Math.floor(li.dataset.totalAlbums / rootInfo.totalAlbums * 100)}%), ` +
            `${li.dataset.totalAudioFiles} tracks ` +
            `(${Math.floor(li.dataset.totalAudioFiles / rootInfo.totalAudioFiles * 100)}%)`;
    }
    newSpan.innerText = text;
    newSpan.setAttribute("class", "hover-details");
    return newSpan;
}

/**
 * Moves <li> with the class name "album" to the bottom of its parent <ul>.
 * Imitative of OS file explorers displaying subdfolders at the top of each
 * directory followed by files. Note that thes <li> albums do represent real
 * folders on the file system.
 * @param {HTMLElement} elem The root node at which to start the DFS. 
 */
const organizeAlbums = (elem) => {
    if (elem === undefined) return;

    const stack = new Array;
    for (let child of elem.children) {
        if (child.className.indexOf("album") === -1) {
            organizeAlbums(child.children[0]);
            continue;
        }
        stack.push(child);
    }
    for (let child of stack) {
        elem.appendChild(child);
    }
}

