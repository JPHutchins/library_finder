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
        commandSubtitleContainer: document.getElementById("command-subtitle-container"),
        main: document.getElementsByClassName("main")[0],
        explorerContainer: document.getElementById("explorer-container"),
        insights: document.getElementById("insights"),
        help: document.getElementById("help"),
        about: document.getElementById("about"),
        disabler: document.getElementById("disabler"),
        fullPathDisplay: document.getElementById("full-path-display"),
        searchResults: document.getElementById("search-results"),
        libraryItems: document.querySelectorAll(".library-item"),
        libraryItemModal: document.getElementById("library-item-modal"),
        libraryItemModalItems: document.getElementById("library-item-modal")
            .getElementsByClassName('modal-menu-item'),
        footer: document.getElementById("footer"),
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
        newBr = document.createElement("br");
        elem.appendChild(newBr)
        elem.appendChild(details);
    });
    elements.libraryExplorer.querySelectorAll(".library-item-menu-button").forEach((node) =>
        node.onclick = (e) => {
            updateState({
                type: "CLICK_ITEM_BUTTON",
                node: e.target,
                event: e
            })
        }
    )
    elements.commandSubtitleContainer.appendChild(commandline(elements));
    elements.help.appendChild(closeSidebarButton());
    elements.help.appendChild(helpContent());
    elements.about.appendChild(closeSidebarButton());
    elements.about.appendChild(aboutContent());
    elements.footer.appendChild(footerContent());

    elements.insights.insertBefore(closeSidebarButton(), elements.insights.children[0]);

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
            enableNext: false,
            enablePrevious: false
        },
        explorer: {
            hoverPath: "",
            openFolders: new Set,
            hoverSelectedNode: null,
            openMenu: null,
            menuPos: { top: 0, right: 0 }
        },
        sidebar: {
            expanded: false,
            content: null
        },
    }

    setTimeout(() => indexForSearch(elements.libraryExplorer, state.search.index), 0);

    /*-------------------------------------------------------------------------
        Initialize listeners.
    -------------------------------------------------------------------------*/

    elements.help.querySelectorAll("h2").forEach((node) => {
        node.onclick = (e) => {
            updateState({
                type: "CLICK_HELP_SECTION_TITLE",
                node: e.target
            })
        }
    })

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

    document.onmouseover = (e) => {
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
        const _node = doesSomeParentBelong(e.target, "largest-folders");
        if (!_node) return;
        updateUi({
            type: "JUMP_TO_NODE",
            node: findFolder(_node.dataset.fullPath)
        })
    }

    elements.disabler.onclick = (e) => {
        updateUi({
            type: "CLOSE_ITEM_MENU",
            node: null
        })
    }

    document.getElementById(
        "insights-button").onclick = (e) => {
            updateState({
                type: "CHANGE_SIDEBAR_CONTENT",
                div: "sidebar",
                node: elements.insights
            })
        }

    document.getElementById(
        "help-button").onclick = (e) => {
            updateState({
                type: "CHANGE_SIDEBAR_CONTENT",
                div: "sidebar",
                node: elements.help
            })
        }

    document.getElementById(
        "about-button").onclick = (e) => {
            updateState({
                type: "CHANGE_SIDEBAR_CONTENT",
                div: "sidebar",
                node: elements.about
            })
        }

    document.querySelectorAll(".close-sidebar-button").forEach((elem) => {
        elem.onclick = (e) => {
            // This state update is "changing to the current content".
            // Changing to the current content means close the sidebar.
            updateState({
                type: "CHANGE_SIDEBAR_CONTENT",
                div: "sidebar",
                node: state.sidebar.content
            })
        }
    })


/*-------------------------------------------------------------------------
    Initialize functions and constants that require context.
-------------------------------------------------------------------------*/

const itemMenu = itemMenuMaker(
    elements.libraryItemModal,
    elements.libraryItemModal.getElementsByClassName("modal-menu-item"))
// provide these functions with context... needs more thought...
const findAll = searchIndex(state)
const findFolder = makeFindFolder(elements)

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
            updateState({ type: "UPDATE_BUTTON_STATES" });
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
            updateState({ type: "UPDATE_BUTTON_STATES" });
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
            updateState({ type: "UPDATE_BUTTON_STATES" });
            break;
        case "UPDATE_BUTTON_STATES":
            updateButtonState(state);
            if (state.search.enableNext) {
                updateUi({
                    type: "ENABLE_BUTTON",
                    node: elements.findNext
                })
            }
            else {
                updateUi({
                    type: "DISABLE_BUTTON",
                    node: elements.findNext
                })
            }
            if (state.search.enablePrevious) {
                updateUi({
                    type: "ENABLE_BUTTON",
                    node: elements.findPrevious
                })
            }
            else {
                updateUi({
                    type: "DISABLE_BUTTON",
                    node: elements.findPrevious
                })
            }
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
        case "CLICK_ITEM_BUTTON":
            state.explorer.menuPos = getMenuButtonClickPos(
                state.explorer.hoverSelectedNode, action.event);
            updateUi({
                type: "OPEN_ITEM_MENU",
                node: state.explorer.hoverSelectedNode
            });
            state.explorer.openMenu = state.explorer.hoverSelectedNode;
            break;
        case "CHANGE_HOVER_SELECTED_NODE":
            const _node = doesSomeParentBelong(action.node, "library-item");
            if (!_node) {
                updateUi({ type: "HIDE_HOVER_DETAILS" });
                state.explorer.hoverSelectedNode = null;
                state.explorer.hoverPath = "";
                updateUi({ type: "CHANGE_HOVER_PATH" });
                break;
            }
            else {
                updateUi({ type: "HIDE_HOVER_DETAILS" });
                state.explorer.hoverSelectedNode = _node;
                state.explorer.hoverPath = getFullPath(
                    state.explorer.hoverSelectedNode);
                updateUi({ type: "CHANGE_HOVER_PATH" });
                updateUi({ type: "SHOW_HOVER_DETAILS" });
                break;
            }
        case "CHANGE_SIDEBAR_CONTENT":
            if (action.node == state.sidebar.content) {
                if (state[action.div].expanded) {
                    updateUi({
                        type: "CLOSE_DIV",
                        node: action.node
                    });
                    state[action.div].expanded = false;
                    state.sidebar.content = action.node;
                    break;
                }
                else {
                    updateUi({
                        type: "EXPAND_DIV",
                        node: action.node
                    });
                    state[action.div].expanded = true;
                    state.sidebar.content = action.node;
                    break;
                }
            }

            else if (state[action.div].expanded) {
                updateUi({
                    type: "CHANGE_CONTENT",
                    old: state.sidebar.content,
                    node: action.node
                });
                state.sidebar.content = action.node;
                state[action.div].expanded = true;
                break;
            }
            else {
                updateUi({
                    type: "EXPAND_DIV",
                    node: action.node
                });
                state[action.div].expanded = true;
                state.sidebar.content = action.node;
                break;
            }
        case "CLICK_HELP_SECTION_TITLE":
            const helpSection = action.node.parentElement;
            if (helpSection == state.sidebar.openHelpSection) {
                updateUi({
                    type: "CLOSE_HELP_TEXT",
                    node: helpSection
                })
                state.sidebar.openHelpSection = null;
                break;
            }
            updateUi({
                type: "CLOSE_HELP_TEXT",
                node: state.sidebar.openHelpSection
            })
            updateUi({
                type: "OPEN_HELP_TEXT",
                node: helpSection
            })
            state.sidebar.openHelpSection = helpSection
            break;
        default:
            return;
    }
}

/*-------------------------------------------------------------------------
    Handle changes to UI state.
-------------------------------------------------------------------------*/

const updateUi = (action) => {
    //console.log(action)
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
            elements.libraryItemModal.style.left = state.explorer.menuPos.left;
            elements.libraryItemModal.classList.add("show-modal");
            elements.disabler.style.visibility = 'visible';
            // TODO: scroll into view if needed
            break;
        case "CLOSE_ITEM_MENU":
            elements.libraryItemModal.classList.remove("show-modal");
            elements.disabler.style.visibility = 'hidden';
            elements.libraryItemModal.style.top = "0px";
            elements.libraryItemModal.style.left = "0px";
            break;
        case "HIDE_HOVER_DETAILS":
            if (!state.explorer.hoverSelectedNode) break;
            if (state.explorer.hoverSelectedNode.querySelector(".hover-details")) {
                state.explorer.hoverSelectedNode.querySelector(".hover-details").classList.add('hidden');
            }
            break;
        case "SHOW_HOVER_DETAILS":
            if (!state.explorer.hoverSelectedNode) break;
            if (state.explorer.hoverSelectedNode.querySelector(".hover-details")) {
                state.explorer.hoverSelectedNode.querySelector(
                    ".hover-details").classList.remove('hidden');
            }
            break;
        case "CLOSE_DIV":
            elements.main.style.marginLeft = '0px';
            elements.explorerContainer.style.marginLeft = "0px";
            action.node.style.visibility = 'hidden';
            break;
        case "EXPAND_DIV":
            action.node.style.visibility = 'visible';
            elements.explorerContainer.style.marginLeft = "400px";
            break;
        case "CHANGE_CONTENT":
            if (action.old) {
                action.old.style.visibility = "hidden";
            }
            action.node.style.visibility = 'visible';
            break;
        case "CLOSE_HELP_TEXT":
            if (!action.node) break;
            const _closeTarget = action.node.querySelector(".slide-open-text");
            _closeTarget.style.transitionDelay = "0s"
            _closeTarget.style.maxHeight = "0px";
            break;
        case "OPEN_HELP_TEXT":
            if (!action.node) break;
            const _openTarget = action.node.querySelector(".slide-open-text");
            _openTarget.style.transitionDelay =
                state.sidebar.openHelpSection ? ".5s" : "0s";
            _openTarget.style.maxHeight = "400px";
            break;
        case "DISABLE_BUTTON":
            action.node.classList.remove("hover-button");
            action.node.classList.remove("click-button");
            action.node.style.borderColor = "hsl(0, 0%, 90%)";
            action.node.disabled = true;
            break;
        case "ENABLE_BUTTON":
            action.node.classList.add("hover-button");
            action.node.classList.add("click-button");
            action.node.style.borderColor = "black";
            action.node.disabled = false;
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

/*-------------------------------------------------------------------------
  Initialize the UI.
-------------------------------------------------------------------------*/

updateState({
    type: "FOLDER_CLICK",
    node: elements.libraryExplorer.children[0]
});
updateState({ type: "UPDATE_BUTTON_STATES" });
}

/*-----------------------------------------------------------------------------
    Utility functions.
-----------------------------------------------------------------------------*/

const updateButtonState = (state) => {
    buttonEnabled(state, "next") ?
        state.search.enableNext = true :
        state.search.enableNext = false;
    buttonEnabled(state, "previous") ?
        state.search.enablePrevious = true :
        state.search.enablePrevious = false;
}

const buttonEnabled = (state, button) => {
    switch (button) {
        case "next":
            if (state.search.i >= state.search.results.length - 1) {
                return false;
            }
            return true;
        case "previous":
            if (state.search.i <= 0) {
                return false;
            }
            return true;
    }
}


const getMenuButtonClickPos = (node, e) => {
    parentRect = node.getBoundingClientRect()
    const top = e.clientY + window.scrollY
    const left = e.clientX
    return {
        top: top + "px",
        left: left + "px"
    }
}

const doesSomeParentBelong = (node, className) => {
    if (!node) return false;
    if (node.classList.contains(className)) return node;
    return node.parentElement &&
        doesSomeParentBelong(node.parentElement, className);
}

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
        () => node.style.background = node.dataset.backgroundColor, 2000)
    const colorEdit = node.dataset.backgroundColor.slice(
        0, node.dataset.backgroundColor.indexOf(","))
    node.style.backgroundColor = colorEdit + ", 75%, 75%)"
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

const commandline = (elements) => {
    const commandline = document.createElement("h3");
    commandline.setAttribute("id", "command-subtitle");
    commandline.innerText = "library_finder " + elements.command.dataset.command;
    return commandline;
}

const helpContent = () => {
    const helpContent = document.createElement("div");
    helpContent.setAttribute("id", "guide-container")
    helpContent.innerHTML = `
    <div id="about-navigation">
        <h2>navigation</h2>
        <div class="slide-open-text">
            
            At the top of the page you will find a navigation bar. Underneath
            the title is the command that created this file. Below that, 
            the full pathname of the currently hovered library item will be 
            displayed. On the right side of the navigation is search.
            <hr>
        </div>
      
    </div>
    <div id="about-search">
        <h2>search</h2>
        <div class="slide-open-text">
           
            The search at the right is a keyword search that will rank results
            by the number of words that were matched regardless of order. You
            can scroll through the results using the previous (^) and next (v) 
            buttons to the right of the search box.  Usually the top results
            will be the ones you are looking for.
            <hr>
        </div>
        
    </div>
    <div id="about-insights">
        <h2>insights</h2>
        <div class="slide-open-text">
           
            Below the navigation bar is a panel labeled "Insights". Click on it
            to view a list of the ten paths that contain the most albums.  Each
            entry displays how many albums and tracks it contains and what 
            percentage of the total this accounts for. You may click on any of
            these items to reveal them in the Explorer below.
            <hr>
        </div>
    </div>
    <div id="about-explorer">
        <h2>explorer</h2>
        <div class="slide-open-text">
           
            The Library Explorer is a file explorer that contains only the media
            type that you are looking for.  Each folder is colored on a gradient
            from light-cold-grey to dark-warm-grey that corresponds to the
            percentage of albums that folder contains. Every folder 
            will show details about its contents on hover and is expandable by
            click. The menu icon (=) at the right is a context menu that gives you
            the option to copy the full path or open the folder in a new tab for
            previewing.
            <hr>
        </div>
    </div>
    <div id="about-finder">
        <h2>library_finder commands</h2>
        <div class="slide-open-text">
           
        Usage: <code>library_finder &ltpath> [options]</code><br><br>

        Options:
            <li><code>--html</code><br> Output results to ./library_explorer.html instead of printing to terminal.</li>
            <li><code>--type &ltkind></code><br> Specify the kind of file library to search for as "photo", "video" or "audio". Default is audio.</li>
            <li><code>--tolerance &ltnumber></code><br> Specify how many non-target file types to allow per folder before skipping. Default is 2.</li>
            <li><code>--help</code><br> Describe command line arguments and options.</li>
            <a href="https://github.com/JPHutchins/library_finder/wiki/Command-Line-Usage" target="_blank" 
        rel="noreferrer">More info on the Wiki</a>
        <hr>
        </div>
        
    </div>
    `;
    return helpContent;
}

const aboutContent = () => {
    const aboutContent = document.createElement("div");
    aboutContent.setAttribute("id", "about-container")
    aboutContent.innerHTML = `
        <div>
        <h2>goals</h2>
            <p>
            library_finder will quickly index a filesystem by including only a target 
            media type.  library_explorer will present the user with an intuitive means of 
            seeing the paths of the filetype they are looking for with minimal
            risk of missing anything.
            <br>
            <a href="https://github.com/JPHutchins/library_finder/wiki" target="_blank" rel="noreferrer">Wiki</a>
            </p>
            <hr>
        <h2>technologies</h2>
            <p>
            Cross-platform compatability is very important.  library_finder
            is written in C style C++.  library_explorer is written in
            HTML, mostly generated by library_finder, "vanilla" JavaScript ES6
            and CSS.  library_explorer does not make any use of network
            resources and does not require an internet connection.
            <br>
            <a href="https://github.com/JPHutchins/library_finder" target="_blank" rel="noreferrer">Source Code</a>
            </p>
           
            <hr>
        </div>
        `
    aboutContent.appendChild(footerContent());
    return aboutContent;
}

const footerContent = () => {
    const footerContent = document.createElement("div");
    footerContent.innerHTML = `
        Copyright &copy 2020 J.P. Hutchins.  GNU General Public License.
        <br>
        jphutchins@gmail.com
        <br>
        ${githubLink}
        ${linkedInLink}
    `
    return footerContent;
}

const closeSidebarButton = () => {
    const button = document.createElement("div");
    button.setAttribute("class", "close-sidebar-button");
    button.innerHTML = `${closeIcon}`;
    return button;
}


const linkedInIcon = `<svg width="50" height="50" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="linkedin" class="icon svg-inline--fa fa-linkedin fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>`
const githubIcon = `<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github-square" class="icon svg-inline--fa fa-github-square fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM277.3 415.7c-8.4 1.5-11.5-3.7-11.5-8 0-5.4.2-33 .2-55.3 0-15.6-5.2-25.5-11.3-30.7 37-4.1 76-9.2 76-73.1 0-18.2-6.5-27.3-17.1-39 1.7-4.3 7.4-22-1.7-45-13.9-4.3-45.7 17.9-45.7 17.9-13.2-3.7-27.5-5.6-41.6-5.6-14.1 0-28.4 1.9-41.6 5.6 0 0-31.8-22.2-45.7-17.9-9.1 22.9-3.5 40.6-1.7 45-10.6 11.7-15.6 20.8-15.6 39 0 63.6 37.3 69 74.3 73.1-4.8 4.3-9.1 11.7-10.6 22.3-9.5 4.3-33.8 11.7-48.3-13.9-9.1-15.8-25.5-17.1-25.5-17.1-16.2-.2-1.1 10.2-1.1 10.2 10.8 5 18.4 24.2 18.4 24.2 9.7 29.7 56.1 19.7 56.1 19.7 0 13.9.2 36.5.2 40.6 0 4.3-3 9.5-11.5 8-66-22.1-112.2-84.9-112.2-158.3 0-91.8 70.2-161.5 162-161.5S388 165.6 388 257.4c.1 73.4-44.7 136.3-110.7 158.3zm-98.1-61.1c-1.9.4-3.7-.4-3.9-1.7-.2-1.5 1.1-2.8 3-3.2 1.9-.2 3.7.6 3.9 1.9.3 1.3-1 2.6-3 3zm-9.5-.9c0 1.3-1.5 2.4-3.5 2.4-2.2.2-3.7-.9-3.7-2.4 0-1.3 1.5-2.4 3.5-2.4 1.9-.2 3.7.9 3.7 2.4zm-13.7-1.1c-.4 1.3-2.4 1.9-4.1 1.3-1.9-.4-3.2-1.9-2.8-3.2.4-1.3 2.4-1.9 4.1-1.5 2 .6 3.3 2.1 2.8 3.4zm-12.3-5.4c-.9 1.1-2.8.9-4.3-.6-1.5-1.3-1.9-3.2-.9-4.1.9-1.1 2.8-.9 4.3.6 1.3 1.3 1.8 3.3.9 4.1zm-9.1-9.1c-.9.6-2.6 0-3.7-1.5s-1.1-3.2 0-3.9c1.1-.9 2.8-.2 3.7 1.3 1.1 1.5 1.1 3.3 0 4.1zm-6.5-9.7c-.9.9-2.4.4-3.5-.6-1.1-1.3-1.3-2.8-.4-3.5.9-.9 2.4-.4 3.5.6 1.1 1.3 1.3 2.8.4 3.5zm-6.7-7.4c-.4.9-1.7 1.1-2.8.4-1.3-.6-1.9-1.7-1.5-2.6.4-.6 1.5-.9 2.8-.4 1.3.7 1.9 1.8 1.5 2.6z"></path></svg>`
const closeIcon = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="times" class="svg-inline--fa fa-times fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg>`

const linkedInLink = `<a class="icon-link" href="https://www.linkedin.com/in/j-p-hutchins-17357547" target="_blank" rel="noreferrer">${linkedInIcon}</a>`
const githubLink = `<a class="icon-link" href="https://github.com/JPHutchins" target="_blank" rel="noreferrer">${githubIcon}</a>`