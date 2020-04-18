window.onload = () => {
    /*-------------------------------------------------------------------------
        Add DOM elements and styling, initialize state, and set handlers.
    -------------------------------------------------------------------------*/
    const elements = {
        command: document.getElementById("command"),
        searchText: document.getElementById("search-text"),
        libraryExplorer: document.getElementById('library-explorer'),
        navbar: document.getElementsByClassName("navbar")[0],
        findNext: document.getElementById("find-next"),
        findPrevious: document.getElementById("find-previous"),
        insights: document.getElementById("insights"),
        disabler: document.getElementById("disabler"),
        fullPathDisplay: document.getElementById("full-path-display"),
        searchResults: document.getElementById("search-results"),
        libraryItems: document.querySelectorAll(".library-item"),
        libraryItemModal: document.getElementById("library-item-modal"),
        libraryItemModalItems: document.getElementById("library-item-modal")
            .getElementsByClassName('modal-menu-item')
    }

    const rootInfo = elements.libraryExplorer.children[0].dataset;

    organizeAlbums(elements.libraryExplorer.children[0].children[0]);

    elements.libraryExplorer.getElementsByTagName('UL')[0].classList.add("fade");

    const menuIcon = createHamburgerMenu();

    elements.libraryItems.forEach((elem) => {
        insertHoverDetailsBeforeUL(elem, menuIcon, rootInfo);
        styleTheListElement(elem, rootInfo);
    });
    document.querySelectorAll(".largest-folders").forEach((elem) => {
        styleTheListElement(elem, rootInfo);
        const details = hoverDetails(elem, menuIcon, rootInfo)
        elem.appendChild(details);
    });
    elements.libraryExplorer.querySelectorAll(".library-item-menu-button").forEach((node) =>
        node.onclick = (e) => {
            updateState({
                type: "CLICK_ITEM_BUTTON",
                node: e.target
            })
        }
    )

    const commandline = document.createElement("h3");
    commandline.innerText = "library_finder " + elements.command.dataset.command;
    elements.navbar.insertBefore(commandline, elements.fullPathDisplay)

    const expanderButton = document.createElement("span");
    expanderButton.appendChild(menuIcon);
    expanderButton.setAttribute('id', 'insights-expander-button');
    elements.insights.insertBefore(expanderButton, elements.insights.children[0]);


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
            openFolders: new Set,
            hoverSelectedNode: null,
            openMenu: null,
            menuPos: { top: 0, right: 0 }
        },
        insights: {
            expanded: false,
        }
    }

    setTimeout(() => indexForSearch(elements.libraryExplorer, state.search.index), 0);

    /*-------------------------------------------------------------------------
        Initialize listeners.
    -------------------------------------------------------------------------*/
    const getMenuButtonClickPos = (node) => {
        parentRect = node.getBoundingClientRect()
        const top = parentRect.top + window.pageYOffset
        const right = window.innerWidth - parentRect.right
        return {
            top: top + 27 + "px",
            right: right - 20 + "px"
        }
    }

    const itemMenu = itemMenuMaker(
        elements.libraryItemModal,
        elements.libraryItemModal.getElementsByClassName("modal-menu-item"))

    elements.libraryExplorer.onclick = (e) => {
        updateState({
            type: "FOLDER_CLICK",
            node: e.target
        });
    }

    elements.searchText.onkeyup = (e) => {
        updateState({
            type: "NEW_QUERY",
            text: e.target.value
        })
    }

    elements.libraryExplorer.onmouseover = (e) => {
        updateState({
            type: "CHANGE_HOVER_SELECTED_NODE",
            node: e.target
        })
    };

    elements.findNext.onclick = (e) => {
        updateState({ type: "FIND_NEXT" })
    };

    elements.findPrevious.onclick = (e) => {
        updateState({ type: "FIND_PREVIOUS" })
    }

    elements.insights.onclick = (e) => {
        if (!state.insights.expanded &&
            !e.target.closest("#insights-expander-button")) {
            updateState({ type: "EXPANDER_CLICK" })
            return;
        }
        if (!e.target.classList.contains('largest-folders')) return;
        updateUi({
            type: "JUMP_TO_NODE",
            node: findFolder(e.target.dataset.fullPath)
        })
    }

    elements.libraryExplorer.oncontextmenu = (e) => {
        // e.preventDefault();
        // updateState({
        //     type: "RIGHT_CLICK",
        //     event: e
        // })
    }

    elements.disabler.onclick = (e) => {
        updateUi({
            type: "CLOSE_ITEM_MENU",
            node: null
        })
    }

    document.getElementById(
        "insights-expander-button").onclick = (e) => {
            updateState({ type: "EXPANDER_CLICK" })
        }

    /*-------------------------------------------------------------------------
        Handle changes to state.
    -------------------------------------------------------------------------*/
    const updateState = (action) => {
        switch (action.type) {
            case "NEW_QUERY":
                if (action.text === state.search.query) break;
                state.search.query = action.text;
                updateState({ type: "NEW_SEARCH" });
                break;
            case "NEW_SEARCH":
                state.search.previousResult = (
                    state.search.results ?
                        state.search.results[state.search.i] : null);
                state.search.results = findAll(state.search.query);
                state.search.resultsText = getSearchResultText(
                    state.search.results);
                state.search.i = 0;
                updateUi({ type: "SCROLL_SEARCH" });
                break;
            case "FIND_NEXT":
                if (state.search.i < state.search.results.length - 1) {
                    state.search.previousResult = (
                        state.search.results ?
                            state.search.results[state.search.i] : null);
                    state.search.i++;
                    state.search.resultsText = getSearchResultText(
                        state.search.results);
                    updateUi({ type: "SCROLL_SEARCH" });
                }
                // if == length disable the up button
                break;
            case "FIND_PREVIOUS":
                if (state.search.i > 0) {
                    state.search.previousResult = (
                        state.search.results ?
                            state.search.results[state.search.i] : null);
                    state.search.i--;
                    state.search.resultsText = getSearchResultText(
                        state.search.results);
                    updateUi({ type: "SCROLL_SEARCH" });
                }
                // if == 0 disable the down button
                break;
            case "FOLDER_CLICK":
                let node = action.node;
                if (node.classList.contains("hover-details")) {
                    node = node.parentElement; // click was on hover-details
                }
                updateUi({
                    type: "FOLDER_CLICK",
                    node: node
                })
                break;
            case "TOGGLE_FOLDER":
                action.open ?
                    state.explorer.openFolders.add(action.node) :
                    state.explorer.openFolders.delete(action.node)
                break;
            case "RIGHT_CLICK":
                // state.explorer.menuPos = getPosition(action.event)
                // console.log(state.explorer.menuPos)
                // updateUi({
                //     type: "OPEN_ITEM_MENU",
                //     node: state.explorer.hoverSelectedNode
                // })
                break;
            case "CLICK_ITEM_BUTTON":
                state.explorer.menuPos = getMenuButtonClickPos(
                    state.explorer.hoverSelectedNode);
                console.log(state.explorer.menuPos);
                updateUi({
                    type: "OPEN_ITEM_MENU",
                    node: state.explorer.hoverSelectedNode
                });
                state.explorer.openMenu = state.explorer.hoverSelectedNode;
                break;
            case "CHANGE_HOVER_SELECTED_NODE":
                if (!action.node.classList.contains("library-item")) break;
                updateUi({ type: "HIDE_HOVER_DETAILS" });
                state.explorer.hoverSelectedNode = action.node;
                state.explorer.hoverPath = getFullPath(
                    state.explorer.hoverSelectedNode);
                updateUi({ type: "CHANGE_HOVER_PATH" });
                updateUi({ type: "SHOW_HOVER_DETAILS" });
                break;
            case "EXPANDER_CLICK":
                if (state.insights.expanded) {
                    updateUi({ type: "CLOSE_INSIGHTS" });
                    state.insights.expanded = false;
                }
                else {
                    updateUi({ type: "EXPAND_INSIGHTS" });
                    state.insights.expanded = true;
                }
                break;
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
                const _state = ui_ToggleFolder(action.node)
                updateState({
                    type: "TOGGLE_FOLDER",
                    open: _state,
                    node: action.node
                })
                break;
            case "JUMP_TO_NODE":
                ui_JumpToNode(action.node)
                break;
            case "OPEN_ITEM_MENU":
                itemMenu(action.node);
                elements.libraryItemModal.style.top = state.explorer.menuPos.top;
                elements.libraryItemModal.style.right = state.explorer.menuPos.right;
                elements.libraryItemModal.classList.add("show-modal");
                elements.disabler.style.visibility = 'visible';
                // TODO: scroll into view if needed
                break;
            case "CLOSE_ITEM_MENU":
                elements.libraryItemModal.classList.remove("show-modal");
                elements.disabler.style.visibility = 'hidden';
                break;
            case "HIDE_HOVER_DETAILS":
                if (state.explorer.hoverSelectedNode) {
                    state.explorer.hoverSelectedNode.querySelector(
                        ".hover-details").classList.add('hidden');
                }
                break;
            case "SHOW_HOVER_DETAILS":
                state.explorer.hoverSelectedNode.querySelector(
                    ".hover-details").classList.remove('hidden');
                break;
            case "CLOSE_INSIGHTS":
                elements.insights.classList.remove("expanded");
                break;
            case "EXPAND_INSIGHTS":
                elements.insights.classList.add("expanded")
                break;
        }
    }

    /*-------------------------------------------------------------------------
        UI functions for interacting with DOM.
    -------------------------------------------------------------------------*/
    const ui_ToggleFolder = (node) => {
        return dropDownDirectory(node);
    }

    const ui_ChangeHoverPath = () => {
        elements.fullPathDisplay.innerText = state.explorer.hoverPath
    }

    const ui_ScrollSearch = () => {
        const node = state.search.results[state.search.i]
        nodes = getParentsOfNode(node)
        hideStaleNodes(nodes);
        showFreshNodes(nodes);
        scrollToNode(node);
        //flashNode(node);
        displaySearchResults();
        if (state.search.previousResult) {
            state.search.previousResult.classList.remove(
                'current-search-result')
        }
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
        elements.searchResults.innerText = state.search.resultsText;
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

    // provide these functions with context... needs more thought...
    const findAll = searchIndex(state)
    const findFolder = makeFindFolder(elements)

    updateState({
        type: "FOLDER_CLICK",
        node: elements.libraryExplorer.children[0]
    });
}

/*-----------------------------------------------------------------------------
    Utility functions.
-----------------------------------------------------------------------------*/

const searchIndex = (state) => (query) => {
    const index = state.search.index;
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
        }
        for (let child of node.children) {
            indexNext(child)
        }
    }
    indexNext(node)
    return index;
}

const makeFindFolder = (elements) => (fullPath) => {
    for (const node of elements.libraryItems) {
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
    const colorEdit = node.dataset.backgroundColor.slice(
        0, node.dataset.backgroundColor.indexOf(","))
    node.style.backgroundColor = colorEdit + ", 75%, 75%)"
    console.log(colorEdit)
}

const highlightNode = (node) => {
    if (!node) return;
    let newColor = node.dataset.backgroundColor.slice(0,
        node.dataset.backgroundColor.length - 2);
    newColor = newColor + ".1)";
    node.style.backgroundColor = newColor;
}

const getFullPath = (node) => {
    if (!node.classList.contains("library-item")) return "";
    return node.dataset.fullPath;
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
        const backgroundColor = `rgba(255, 255, 255)`

        elem.style.backgroundColor = backgroundColor;
        elem.dataset.backgroundColor = backgroundColor;
        return;
    }

    const albums = elem.dataset.totalAlbums;
    const percent = Math.floor(albums / rootInfo.totalAlbums * 100);

    const H = 180 + Math.floor(Math.log2(percent) * 180 / Math.log2(100));
    const S = 8;
    const L = 90 - Math.floor((Math.log2(percent) * 4))

    const backgroundColor = `hsl(${H}, ${S}%, ${L}%)`

    elem.style.backgroundColor = backgroundColor;
    elem.dataset.backgroundColor = backgroundColor;
}

/**
 * Insert the hover details for the element.
 * @param {HTMLElement} elem The HTML node element.
 */
const insertHoverDetailsBeforeUL = (elem, menuIcon, rootInfo) => {
    const ul = elem.getElementsByTagName("UL")[0];
    elem.insertBefore(hoverDetails(elem, menuIcon, rootInfo), ul)
}

/**
 * Takes an <li> and formats its attributes. Returns a new <span> to be 
 * appended under the <li>.
 * @param {HTMLElement} li The <li> that needs hover details added.
 */
const hoverDetails = (li, menuIcon, rootInfo) => {
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
        newSpan.innerText = text;
        return newSpan;
    }
    newSpan.innerText = text;
    newSpan.setAttribute("class", "hover-details hidden");

    const menuButton = document.createElement("span");
    menuButton.appendChild(createHamburgerMenu())
    menuButton.classList.add("library-item-menu-button");
    newSpan.appendChild(menuButton)

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

const itemMenuMaker = (menu, menuItems) => (node) => {
    menuItems[3].children[0].innerText = "Copy full path to clipboard"
    menuItems[0].innerText = node.dataset.fullPath
    menuItems[0].style.fontSize = 'small';
    menuItems[0].style.visibility = 'hidden'
    menuItems[0].style.display = 'block';
    menuItems[2].style.display = 'none';
    menuItems[2].style.width = menuItems[0].offsetWidth + "px";
    menuItems[2].style.display = 'flex';
    menuItems[2].style.fontSize = 'small';
    menuItems[0].style.visibility = 'visible';
    menuItems[0].style.display = "none";
    menuItems[1].innerText = node.dataset.shortname
    menuItems[1].style.fontWeight = "bold";
    menuItems[2].innerText = node.dataset.fullPath

    menuItems[3].children[0].onclick = () => {
        menuItems[2].focus();
        menuItems[2].select();
        menuItems[2].setSelectionRange(0, 99999);
        const successful = document.execCommand("copy");
        menuItems[3].children[0].innerText = successful ?
            "Copied!" :
            "Copy failed.  Highlight and copy manually."

    }
    menuItems[3].children[1].href = "file:///" + node.dataset.fullPath

    menuItems[4].innerText = ((node) => {
        switch (node.classList[0]) {
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
    menuItems[5].innerText = node.dataset.totalAudioFiles ?
        `${node.dataset.totalAudioFiles} audio files` :
        "";
    menuItems[6].innerText = node.dataset.totalAlbums ?
        `${node.dataset.totalAlbums} albums` :
        "";
}

// helper function to get an element's exact position
function getPosition(event) {
    let el = event.target

    console.log(event.clientX)

    var xPosition = 0;
    var yPosition = 0;

    while (el) {
        if (el.tagName == "BODY") {
            // deal with browser quirks with body/window/document and page scroll
            var xScrollPos = el.scrollLeft || document.documentElement.scrollLeft;
            var yScrollPos = el.scrollTop || document.documentElement.scrollTop;

            xPosition += (el.offsetLeft - xScrollPos + el.clientLeft);
            yPosition += (el.offsetTop - yScrollPos + el.clientTop);
        } else {
            xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
        }

        el = el.offsetParent;
    }
    return {
        top: event.clientY + "px",
        right: event.clientX + "px",
    };
}

const createHamburgerMenu = () => {
    const menuIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    menuIcon.setAttribute("width", "20");
    menuIcon.setAttribute("height", "12");

    const r1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r1.setAttribute("width", "20");
    r1.setAttribute("height", "2")
    menuIcon.appendChild(r1);

    const r2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r2.setAttribute("y", "5")
    r2.setAttribute("width", "20");
    r2.setAttribute("height", "2")
    menuIcon.appendChild(r2);

    const r3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r3.setAttribute("y", "10")
    r3.setAttribute("width", "20");
    r3.setAttribute("height", "2")
    menuIcon.appendChild(r3);

    return menuIcon
}; 