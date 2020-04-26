R"=====(<script>window.onload = () => {

    /*-------------------------------------------------------------------------
        Add DOM elements and styling, initialize state, and set handlers.
    -------------------------------------------------------------------------*/

    document.body.insertAdjacentHTML("afterbegin", newHtml);
    document.getElementById("explorer-container").
        insertAdjacentHTML("beforeend", `<footer id="footer"></footer>`);

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
        if (state.explorer.openMenu) return;
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
        updateState({ type: "CLOSE_ITEM_MENU_CLICK" })
    }

    elements.navbar.onclick = (e) => {
        updateState({ type: "CLOSE_ITEM_MENU_CLICK" })
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
            case "CLOSE_ITEM_MENU_CLICK":
                updateUi({ type: "CLOSE_ITEM_MENU" });
                state.explorer.openMenu = null;
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
                elements.libraryItemModal.cl)====="