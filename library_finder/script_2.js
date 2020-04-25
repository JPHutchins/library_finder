R"=====(

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
                elements.libraryItemModal.style.left = Math.min(
                    parseInt(state.explorer.menuPos.left),
                    document.body.clientWidth - elements.libraryItemModal.offsetWidth) - 15 + "px";
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

    if (elem.classList.contains("path")) {
        elem.insertAdjacentHTML("afterbegin", pathIcon);
    }
    else if (elem.classList.contains("album")) {
        elem.insertAdjacentHTML("afterbegin", albumIcon);

        const backgroundColor = `rgba(255, 255, 255)`
        elem.style.backgroundColor = backgroundColor;
        elem.dataset.backgroundColor = backgroundColor;
        return;
    }
    else if (elem.classList.contains("collection")) {
        elem.insertAdjacentHTML("afterbegin", collectionIcon);
    }
    else if (elem.classList.contains("library")) {
        elem.insertAdjacentHTML("afterbegin", libraryIcon);
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
)====="