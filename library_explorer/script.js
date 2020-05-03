window.onload = () => {
  /*----------------------------------------------------------------------------
        Add DOM elements and styling, initialize state, and set handlers.
    --------------------------------------------------------------------------*/

  document.body.insertAdjacentHTML("afterbegin", newHtml);
  document
    .getElementById("explorer-container")
    .insertAdjacentHTML("beforeend", `<footer id="footer"></footer>`);

  const elements = {
    command: document.getElementById("command"),
    searchText: document.getElementById("search-text"),
    libraryExplorer: document.getElementById("library-explorer"),
    navbar: document.getElementsByClassName("navbar")[0],
    findNext: document.getElementById("find-next"),
    findPrevious: document.getElementById("find-previous"),
    commandSubtitleContainer: document.getElementById(
      "command-subtitle-container"
    ),
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
    libraryItemModalItems: document
      .getElementById("library-item-modal")
      .getElementsByClassName("modal-menu-item"),
    footer: document.getElementById("footer"),
  };

  const rootInfo = elements.libraryExplorer.children[0].dataset;

  organizeAlbums(elements.libraryExplorer.children[0].children[0]);

  elements.libraryExplorer.getElementsByTagName("UL")[0].classList.add("fade");

  const menuIcon = createHamburgerMenu();

  elements.libraryItems.forEach((elem) => {
    insertHoverDetailsBeforeUL(elem, menuIcon, rootInfo);
    styleTheListElement(elem, rootInfo);
  });
  document.querySelectorAll(".largest-folders").forEach((elem) => {
    styleTheListElement(elem, rootInfo);
    const details = hoverDetails(elem, menuIcon, rootInfo);
    newBr = document.createElement("br");
    elem.appendChild(newBr);
    elem.appendChild(details);
  });
  elements.libraryExplorer
    .querySelectorAll(".library-item-menu-button")
    .forEach(
      (node) =>
        (node.onclick = (e) => {
          updateState({
            type: "CLICK_ITEM_BUTTON",
            event: e,
          });
        })
    );
  elements.commandSubtitleContainer.appendChild(commandline(elements));
  elements.help.appendChild(closeSidebarButton());
  elements.help.appendChild(helpContent());
  elements.about.appendChild(closeSidebarButton());
  elements.about.appendChild(aboutContent());
  elements.footer.appendChild(footerContent());

  elements.insights.insertBefore(
    closeSidebarButton(),
    elements.insights.children[0]
  );

  /*----------------------------------------------------------------------------
        Initialize state.
    --------------------------------------------------------------------------*/

  const state = {
    showFiles: commandlineFilesFlag(elements),
    search: {
      index: {},
      query: "",
      results: [],
      resultsText: "",
      i: 0,
      enableNext: false,
      enablePrevious: false,
    },
    explorer: {
      hoverPath: "",
      openFolders: new Set(),
      hoverSelectedNode: null,
      openMenu: null,
      menuPos: { top: 0, right: 0 },
    },
    sidebar: {
      expanded: false,
      content: null,
    },
  };

  setTimeout(
    () => indexForSearch(elements.libraryExplorer, state.search.index),
    0
  );

  /*----------------------------------------------------------------------------
        Initialize listeners.
    --------------------------------------------------------------------------*/

  elements.help.querySelectorAll("h2").forEach((node) => {
    node.onclick = (e) => {
      updateState({
        type: "CLICK_HELP_SECTION_TITLE",
        node: e.target,
      });
    };
  });

  elements.libraryExplorer.onclick = (e) => {
    updateState({
      type: "FOLDER_CLICK",
      node: e.target,
    });
  };

  elements.searchText.onkeyup = (e) => {
    updateState({
      type: "NEW_QUERY",
      text: e.target.value,
    });
  };

  document.onmouseover = (e) => {
    if (state.explorer.openMenu) return;
    updateState({
      type: "CHANGE_HOVER_SELECTED_NODE",
      node: e.target,
    });
  };

  elements.findNext.onclick = (e) => {
    updateState({ type: "FIND_NEXT" });
  };

  elements.findPrevious.onclick = (e) => {
    updateState({ type: "FIND_PREVIOUS" });
  };

  elements.insights.onclick = (e) => {
    const _node = firstParentClassListContains(e.target, "largest-folders");
    if (!_node) return;
    updateUi({
      type: "JUMP_TO_NODE",
      node: findFolder(_node.dataset.fullPath),
    });
  };

  elements.disabler.onclick = (e) => {
    updateState({ type: "CLOSE_ITEM_MENU_CLICK" });
  };

  elements.navbar.onclick = (e) => {
    updateState({ type: "CLOSE_ITEM_MENU_CLICK" });
  };

  document.getElementById("insights-button").onclick = (e) => {
    updateState({
      type: "CHANGE_SIDEBAR_CONTENT",
      div: "sidebar",
      node: elements.insights,
    });
  };

  document.getElementById("help-button").onclick = (e) => {
    updateState({
      type: "CHANGE_SIDEBAR_CONTENT",
      div: "sidebar",
      node: elements.help,
    });
  };

  document.getElementById("about-button").onclick = (e) => {
    updateState({
      type: "CHANGE_SIDEBAR_CONTENT",
      div: "sidebar",
      node: elements.about,
    });
  };

  document.querySelectorAll(".close-sidebar-button").forEach((elem) => {
    elem.onclick = (e) => {
      // This state update is "changing to the current content".
      // Changing to the current content means close the sidebar.
      updateState({
        type: "CHANGE_SIDEBAR_CONTENT",
        div: "sidebar",
        node: state.sidebar.content,
      });
    };
  });

  /*----------------------------------------------------------------------------
        Initialize functions and constants that require context.
    --------------------------------------------------------------------------*/

  const itemMenu = itemMenuMaker(
    elements.libraryItemModal.getElementsByClassName("modal-menu-item")
  );
  // provide these functions with context... needs more thought...
  const keywordSearch = makeKeywordSearch(state);
  const findFolder = makeFindFolder(elements);

  /*----------------------------------------------------------------------------
        Handle changes to state.
    --------------------------------------------------------------------------*/

  const updateState = (action) => {
    switch (action.type) {
      case "NEW_QUERY":
        if (action.text === state.search.query) break;
        state.search.query = action.text;
        updateState({ type: "NEW_SEARCH" });
        break;
      case "NEW_SEARCH":
        state.search.previousResult = state.search.results
          ? state.search.results[state.search.i]
          : null;
        state.search.results = keywordSearch(state.search.query);
        state.search.resultsText = getSearchResultText(state.search.results);
        state.search.i = 0;
        updateUi({ type: "SCROLL_SEARCH" });
        updateState({ type: "UPDATE_BUTTON_STATES" });
        updateState({
          type: "CHANGE_HOVER_SELECTED_NODE",
          node: state.search.results[state.search.i],
        });
        break;
      case "FIND_NEXT":
        if (state.search.i < state.search.results.length - 1) {
          state.search.previousResult = state.search.results
            ? state.search.results[state.search.i]
            : null;
          state.search.i++;
          state.search.resultsText = getSearchResultText(state.search.results);
          updateUi({ type: "SCROLL_SEARCH" });
        }
        updateState({ type: "UPDATE_BUTTON_STATES" });
        updateState({
          type: "CHANGE_HOVER_SELECTED_NODE",
          node: state.search.results[state.search.i],
        });
        break;
      case "FIND_PREVIOUS":
        if (state.search.i > 0) {
          state.search.previousResult = state.search.results
            ? state.search.results[state.search.i]
            : null;
          state.search.i--;
          state.search.resultsText = getSearchResultText(state.search.results);
          updateUi({ type: "SCROLL_SEARCH" });
        }
        updateState({ type: "UPDATE_BUTTON_STATES" });
        updateState({
          type: "CHANGE_HOVER_SELECTED_NODE",
          node: state.search.results[state.search.i],
        });
        break;
      case "UPDATE_BUTTON_STATES":
        updateButtonState(state);
        if (state.search.enableNext) {
          updateUi({
            type: "ENABLE_BUTTON",
            node: elements.findNext,
          });
        } else {
          updateUi({
            type: "DISABLE_BUTTON",
            node: elements.findNext,
          });
        }
        if (state.search.enablePrevious) {
          updateUi({
            type: "ENABLE_BUTTON",
            node: elements.findPrevious,
          });
        } else {
          updateUi({
            type: "DISABLE_BUTTON",
            node: elements.findPrevious,
          });
        }
        break;
      case "FOLDER_CLICK":
        let node = action.node;
        if (node.classList.contains("hover-details")) {
          node = node.parentElement; // click was on hover-details
        }
        updateUi({
          type: "FOLDER_CLICK",
          node: node,
        });
        break;
      case "TOGGLE_FOLDER":
        action.open
          ? state.explorer.openFolders.add(action.node)
          : state.explorer.openFolders.delete(action.node);
        break;
      case "CLICK_ITEM_BUTTON":
        state.explorer.menuPos = getMenuButtonClickPos(action.event);
        updateUi({
          type: "OPEN_ITEM_MENU",
          node: state.explorer.hoverSelectedNode,
        });
        state.explorer.openMenu = state.explorer.hoverSelectedNode;
        break;
      case "CLOSE_ITEM_MENU_CLICK":
        updateUi({ type: "CLOSE_ITEM_MENU" });
        state.explorer.openMenu = null;
        break;
      case "CHANGE_HOVER_SELECTED_NODE":
        const _node = firstParentClassListContains(action.node, "library-item");
        if (!_node) {
          updateUi({
            type: "HIDE_HOVER_DETAILS",
            node: state.explorer.hoverSelectedNode,
          });
          state.explorer.hoverSelectedNode = null;
          state.explorer.hoverPath = "";
          updateUi({ type: "CHANGE_HOVER_PATH" });
          break;
        } else {
          updateUi({
            type: "HIDE_HOVER_DETAILS",
            node: state.explorer.hoverSelectedNode,
          });
          state.explorer.hoverSelectedNode = _node;
          state.explorer.hoverPath = getFullPath(_node);
          updateUi({ type: "CHANGE_HOVER_PATH" });
          updateUi({
            type: "SHOW_HOVER_DETAILS",
            node: _node,
          });
          break;
        }
      case "CHANGE_SIDEBAR_CONTENT":
        if (action.node == state.sidebar.content) {
          if (state[action.div].expanded) {
            updateUi({
              type: "CLOSE_DIV",
              node: action.node,
            });
            state[action.div].expanded = false;
            state.sidebar.content = action.node;
            break;
          } else {
            updateUi({
              type: "EXPAND_DIV",
              node: action.node,
            });
            state[action.div].expanded = true;
            state.sidebar.content = action.node;
            break;
          }
        } else if (state[action.div].expanded) {
          updateUi({
            type: "CHANGE_CONTENT",
            old: state.sidebar.content,
            node: action.node,
          });
          state.sidebar.content = action.node;
          state[action.div].expanded = true;
          break;
        } else {
          updateUi({
            type: "EXPAND_DIV",
            node: action.node,
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
            node: helpSection,
          });
          state.sidebar.openHelpSection = null;
          break;
        }
        updateUi({
          type: "CLOSE_HELP_TEXT",
          node: state.sidebar.openHelpSection,
        });
        updateUi({
          type: "OPEN_HELP_TEXT",
          node: helpSection,
        });
        state.sidebar.openHelpSection = helpSection;
        break;
      default:
        return;
    }
  };

  /*----------------------------------------------------------------------------
        Handle changes to UI state.
    --------------------------------------------------------------------------*/

  const updateUi = (action) => {
    switch (action.type) {
      case "SCROLL_SEARCH":
        ui_ScrollSearch();
        break;
      case "CHANGE_HOVER_PATH":
        ui_ChangeHoverPath();
        break;
      case "FOLDER_CLICK":
        const _state = ui_ToggleFolder(action.node);
        updateState({
          type: "TOGGLE_FOLDER",
          open: _state,
          node: action.node,
        });
        break;
      case "JUMP_TO_NODE":
        ui_JumpToNode(action.node);
        break;
      case "OPEN_ITEM_MENU":
        itemMenu(action.node);
        elements.libraryItemModal.style.top = state.explorer.menuPos.top;
        elements.libraryItemModal.style.left =
          Math.min(
            parseInt(state.explorer.menuPos.left),
            document.body.clientWidth - elements.libraryItemModal.offsetWidth
          ) -
          15 +
          "px";
        elements.libraryItemModal.classList.add("show-modal");
        elements.disabler.style.visibility = "visible";
        // TODO: scroll into view if needed
        break;
      case "CLOSE_ITEM_MENU":
        elements.libraryItemModal.classList.remove("show-modal");
        elements.disabler.style.visibility = "hidden";
        elements.libraryItemModal.style.top = "0px";
        elements.libraryItemModal.style.left = "0px";
        break;
      case "HIDE_HOVER_DETAILS":
        const _oldNode = action.node;
        if (!_oldNode) break;
        _oldNode.style.borderColor = "rgba(0, 0, 0, 0)";

        const _oldDetails = _oldNode.querySelector(".hover-details");
        if (_oldDetails) {
          _oldDetails.classList.add("hidden");
        }
        break;
      case "SHOW_HOVER_DETAILS":
        const _hoveredNode = action.node;
        if (!_hoveredNode) break;
        _hoveredNode.style.borderColor = "rgba(105, 105, 105, 0.507)";

        const _details = _hoveredNode.querySelector(".hover-details");
        if (_details) {
          _details.classList.remove("hidden");
        }

        if (state.showFiles) {
            (_hoveredNode.style.cursor = "pointer");
            break;
        }
        !_hoveredNode.classList.contains("album")
          ? (_hoveredNode.style.cursor = "pointer")
          : (_hoveredNode.style.cursor = "default");

        break;
      case "CLOSE_DIV":
        elements.main.style.marginLeft = "0px";
        elements.explorerContainer.style.marginLeft = "0px";
        action.node.style.visibility = "hidden";
        break;
      case "EXPAND_DIV":
        action.node.style.visibility = "visible";
        elements.explorerContainer.style.marginLeft = "400px";
        break;
      case "CHANGE_CONTENT":
        if (action.old) {
          action.old.style.visibility = "hidden";
        }
        action.node.style.visibility = "visible";
        break;
      case "CLOSE_HELP_TEXT":
        if (!action.node) break;
        const _closeTarget = action.node.querySelector(".slide-open-text");
        _closeTarget.style.transitionDelay = "0s";
        _closeTarget.style.maxHeight = "0px";
        break;
      case "OPEN_HELP_TEXT":
        if (!action.node) break;
        const _openTarget = action.node.querySelector(".slide-open-text");
        _openTarget.style.transitionDelay = state.sidebar.openHelpSection
          ? ".5s"
          : "0s";
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
  };

  /*----------------------------------------------------------------------------
        UI functions for interacting with DOM.
    --------------------------------------------------------------------------*/

  const ui_ToggleFolder = (node) => {
    return dropDownDirectory(node);
  };

  const ui_ChangeHoverPath = () => {
    elements.fullPathDisplay.innerText = state.explorer.hoverPath;
  };

  const ui_ScrollSearch = () => {
    const node = state.search.results[state.search.i];
    nodes = getUlParentsOfNode(node);
    hideStaleNodes(nodes);
    showFreshNodes(nodes);
    scrollToNode(node);
    //flashNode(node);
    displaySearchResults();
    if (state.search.previousResult) {
      state.search.previousResult.classList.remove("current-search-result");
    }
    if (node) node.classList.add("current-search-result");
  };

  const ui_JumpToNode = (node) => {
    nodes = getUlParentsOfNode(node);
    hideStaleNodes(nodes);
    showFreshNodes(nodes);
    scrollToNode(node);
    flashNode(node);
  };

  const displaySearchResults = () => {
    elements.searchResults.innerText = state.search.resultsText;
  };

  const getSearchResultText = (results) => {
    if (!state.search.query) {
      return "";
    } else if (results.length <= 0) {
      return `No results for "${state.search.query}"`;
    } else {
      return `${state.search.i + 1} / ${results.length}`;
    }
  };

  /*----------------------------------------------------------------------------
      Initialize the UI.
    --------------------------------------------------------------------------*/

  updateState({
    type: "FOLDER_CLICK",
    node: elements.libraryExplorer.children[0],
  });
  updateState({ type: "UPDATE_BUTTON_STATES" });
};

/*------------------------------------------------------------------------------
    Utility functions.
------------------------------------------------------------------------------*/

/**
 * Update the state of the "find next" and "find previous buttons".
 * @param {Object} state The state object.
 */
const updateButtonState = (state) => {
  shouldEnableButton(state, "next")
    ? (state.search.enableNext = true)
    : (state.search.enableNext = false);
  shouldEnableButton(state, "previous")
    ? (state.search.enablePrevious = true)
    : (state.search.enablePrevious = false);
};

/**
 * Return true if the button should be enabled, else false.
 * @param {Object} state The state object.
 * @param {String} button The id of the button.
 */
const shouldEnableButton = (state, button) => {
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
};

/**
 * Return an object containing the top and left positions at which the cursor
 * triggered the event.
 * @param {Event} e The event.
 */
const getMenuButtonClickPos = (e) => {
  const top = e.clientY + window.scrollY;
  const left = e.clientX;
  return {
    top: top + "px",
    left: left + "px",
  };
};

/**
 * Beginning with node, recursively search up the element tree and return the
 * first element node that belongs to the specified class.  Return false if no
 * element above the starting node belongs to the specified class.
 * @param {HTMLElement} node The "lowest" node; begin search here.
 * @param {String} className The class name to search for.
 */
const firstParentClassListContains = (node, className) => {
  if (!node) return false;
  if (node.classList.contains(className)) return node;
  return (
    node.parentElement &&
    firstParentClassListContains(node.parentElement, className)
  );
};

/**
 * Return a function that takes a query and returns a list of HTMLElements from
 * the index in the state object that contain one or more keywords from the
 * query.  This list is in a ranked order where all HTMLElements from index
 * [0...a] matched n keywords from the query while HTMLElements from index
 * [a+1...b] matched n-1 keywords from the query and so on.  This ranking has no
 * regard for the order of the words.  The search is not case sensitive.
 * This is a hash lookup - there is no consideration for partial words or
 * misspellings.
 * @param {Object} state The state object containing the index.
 */
const makeKeywordSearch = (state) => (query) => {
  const index = state.search.index;
  if (query == " ") return [];
  lower = query.toLowerCase();
  const words = lower
    .split(" ")
    .filter((word) => word !== "")
    .filter((word) => word !== " ");
  const searchResults = [];
  const orderedResults = new Array(words.length + 1);
  countHits = new Object();

  for (i = 0; i < words.length; i++) {
    if (!index[words[i]]) continue;
    for (const node of index[words[i]]) {
      key = node.dataset.fullPath;
      if (!countHits[key]) countHits[key] = 0;
      countHits[key]++;
      searchResults.push(node);
    }
  }

  for (const node of searchResults) {
    const hits = countHits[node.dataset.fullPath];
    if (!orderedResults[hits]) orderedResults[hits] = new Set();
    orderedResults[hits].add(node);
  }

  completeResults = [];
  for (i = words.length + 1; i >= 1; i--) {
    if (!orderedResults[i]) continue;
    for (const node of orderedResults[i].values()) {
      completeResults.push(node);
    }
  }
  return completeResults;
};

/**
 * Take an index object (empty {}) and fill it with a keyword search index.
 * This keyword index splits each shortname string at the space " " character,
 * converts the string to lower case and creates a key for that keyword in the
 * index.  The value given by each key is a Set containing all of the
 * HTMLElements that contain the data attribute "shortname" containing that
 * keyword.  This is repeated for every child node of the input variable, node,
 * until the entire tree has been indexed for keyword search.
 * @param {HTMLElement} node The root node at which to begin indexing.
 * @param {Object} index The object in which to store the search index.
 */
const indexForSearch = (node, index) => {
  const indexNext = (node) => {
    if (node.dataset.shortname) {
      const keywords = node.dataset.shortname.toLowerCase().split(" ");
      keywords.forEach((keyword) => {
        if (index[keyword] !== undefined) index[keyword].add(node);
        else {
          index[keyword] = new Set();
          index[keyword].add(node);
        }
      });
    }
    for (let child of node.children) {
      indexNext(child);
    }
  };
  indexNext(node);
  return index;
};

/**
 * Returns a function that will search the list of HTMLElements
 * elements.libraryItems and return the first one that has a data attribute
 * "fullPath" matching the argument fullPath.
 * @param {Object} elements The HTMLElements object.
 */
const makeFindFolder = (elements) => (fullPath) => {
  for (const node of elements.libraryItems) {
    if (node.dataset.fullPath === fullPath) return node;
  }
};

/**
 * Return a Set containing the <ul> elements of which node is a descendant.
 * @param {HTMLElement} node The node at which to start search.
 */
const getUlParentsOfNode = (node) => {
  if (!node) return new Set();

  let nodeCursor = node.parentElement;
  const nodeParents = new Set();

  while (nodeCursor) {
    if (nodeCursor.tagName === "UL") nodeParents.add(nodeCursor);
    nodeCursor = nodeCursor.parentElement;
  }
  return nodeParents;
};

/**
 * Hide "library-item" nodes that do not belong to the set setOfNodes argument.
 * For example, a node is "stale" when it is one that was made visible to
 * display a previous search result but is not an ancestor in the tree of the
 * current search result.
 * Return the Set stale which is the difference of the Sets shownNodes and
 * setOfNodes.
 * @param {Set} setOfNodes The set of HTMLElements.
 */
const hideStaleNodes = (setOfNodes) => {
  const currentShownNodes = new Set();
  const shownNodes = document
    .getElementById("library-explorer")
    .getElementsByClassName("show-list");

  for (const shownNode of shownNodes) {
    currentShownNodes.add(shownNode);
  }

  const stale = [...currentShownNodes].filter((node) => {
    return !setOfNodes.has(node);
  });

  for (const node of stale) {
    node.classList.remove("show-list");
  }
  return stale;
};

/**
 * Display all nodes belonging to this set by adding the class "show-list".
 * @param {Set} setOfNodes The set of HTMLElements
 */
const showFreshNodes = (setOfNodes) => {
  for (const node of setOfNodes) {
    node.classList.add("show-list");
  }
  return setOfNodes;
};

/**
 * Smoothly scroll to center the viewport on the argument node.
 * @param {HTMLElement} node The HTML element node.
 */
const scrollToNode = (node) => {
  if (!node) return;
  window.requestAnimationFrame(() =>
    node.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  );
};

/**
 * Flash the node for 2 seconds.  "Flash" means that the saturation and
 * brightness of the color are changed to 75%.
 * For example hsl(55, 8%, 25%) -> hsl(55, 75%, 75%)
 * @param {HTMLElement} node The HTML element node.
 */
const flashNode = (node) => {
  if (!node) return;
  setTimeout(
    () => (node.style.background = node.dataset.backgroundColor),
    2000
  );
  const colorEdit = node.dataset.backgroundColor.slice(
    0,
    node.dataset.backgroundColor.indexOf(",")
  );
  node.style.backgroundColor = colorEdit + ", 75%, 75%)";
};

/**
 * Return the data attribute "fullPath" if the node contains it, else "".
 * @param {HTMLElement} node The HTML element node.
 */
const getFullPath = (node) => {
  if (!node.classList.contains("library-item")) return "";
  return node.dataset.fullPath;
};

/**
 * Add the class "show-list".
 * @param {Event} e.target The target node.
 */
const dropDownDirectory = (node) => {
  const toggleShowList = toggleClassName("show-list");
  let state;
  for (const child of node.children) {
    if (child === undefined) continue;
    toggleShowList(child);
    state = child.classList.contains("show-list");
  }
  return state;
};

/**
 * Returns a function that toggles the class name on and off.
 * @param {String} className The class name to toggle on and off.
 */
const toggleClassName = (className) => (element) => {
  return element.classList.toggle(className);
};

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
  } else if (elem.classList.contains("album")) {
    elem.insertAdjacentHTML("afterbegin", albumIcon);

    const backgroundColor = `rgba(255, 255, 255)`;
    elem.style.backgroundColor = backgroundColor;
    elem.dataset.backgroundColor = backgroundColor;
    return;
  } else if (elem.classList.contains("collection")) {
    elem.insertAdjacentHTML("afterbegin", collectionIcon);
  } else if (elem.classList.contains("library")) {
    elem.insertAdjacentHTML("afterbegin", libraryIcon);
  }

  const albums = elem.dataset.totalAlbums;
  const percent = Math.floor((albums / rootInfo.totalAlbums) * 100);

  const H = 180 + Math.floor((Math.log2(percent) * 180) / Math.log2(100));
  const S = 8;
  const L = 90 - Math.floor(Math.log2(percent) * 4);
  const backgroundColor = `hsl(${H}, ${S}%, ${L}%)`;

  elem.style.backgroundColor = backgroundColor;
  elem.dataset.backgroundColor = backgroundColor;
};

/**
 * Insert the hover details for the element.
 * @param {HTMLElement} elem The HTML node element.
 */
const insertHoverDetailsBeforeUL = (elem, menuIcon, rootInfo) => {
  const ul = elem.getElementsByTagName("UL")[0];
  elem.insertBefore(hoverDetails(elem, menuIcon, rootInfo), ul);
};

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
  } else if (li.classList.contains("collection")) {
    text =
      `${li.dataset.totalAlbums} albums, ` +
      `${li.dataset.totalAudioFiles} tracks`;
  } else if (li.classList.contains("album")) {
    text = `${li.dataset.containedAudioFiles} tracks`;
  } else if (li.classList.contains("path")) {
    text =
      `${li.dataset.totalAlbums} albums, ` +
      `${li.dataset.totalAudioFiles} tracks`;
  } else if (li.classList.contains("largest-folders")) {
    text =
      `${li.dataset.totalAlbums} albums ` +
      `(${Math.floor(
        (li.dataset.totalAlbums / rootInfo.totalAlbums) * 100
      )}%), ` +
      `${li.dataset.totalAudioFiles} tracks ` +
      `(${Math.floor(
        (li.dataset.totalAudioFiles / rootInfo.totalAudioFiles) * 100
      )}%)`;
    newSpan.innerText = text;
    return newSpan;
  }
  newSpan.innerText = text;
  newSpan.setAttribute("class", "hover-details hidden");

  const menuButton = document.createElement("span");
  menuButton.appendChild(createHamburgerMenu());
  menuButton.classList.add("library-item-menu-button");
  newSpan.appendChild(menuButton);

  return newSpan;
};

/**
 * Moves <li> with the class name "album" to the bottom of its parent <ul>.
 * Imitative of OS file explorers displaying subdfolders at the top of each
 * directory followed by files. Note that thes <li> albums do represent real
 * folders on the file system.
 * @param {HTMLElement} elem The root node at which to start the DFS.
 */
const organizeAlbums = (elem) => {
  if (elem === undefined) return;

  const stack = new Array();
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
};

/**
 * Return a function that generates a context menu for the argument node.
 * @param {Array} menuItems An array of HTMLElements.
 */
const itemMenuMaker = (menuItems) => (node) => {
  menuItems[3].children[0].innerText = "Copy full path to clipboard";
  menuItems[0].innerText = node.dataset.fullPath;
  menuItems[0].style.fontSize = "small";
  menuItems[0].style.visibility = "hidden";
  menuItems[0].style.display = "block";
  menuItems[2].style.display = "none";
  menuItems[2].style.width = menuItems[0].offsetWidth + "px";
  menuItems[2].style.display = "flex";
  menuItems[2].style.fontSize = "small";
  menuItems[0].style.visibility = "visible";
  menuItems[0].style.display = "none";
  menuItems[1].innerText = node.dataset.shortname;
  menuItems[1].style.fontWeight = "bold";
  menuItems[2].innerText = node.dataset.fullPath;

  menuItems[3].children[0].onclick = () => {
    menuItems[2].focus();
    menuItems[2].select();
    menuItems[2].setSelectionRange(0, 99999);
    const successful = document.execCommand("copy");
    menuItems[3].children[0].innerText = successful
      ? "Copied!"
      : "Copy failed.  Highlight and copy manually.";
  };
  menuItems[3].children[1].href = "file:///" + node.dataset.fullPath;

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
  menuItems[5].innerText = node.dataset.totalAudioFiles
    ? `${node.dataset.totalAudioFiles} audio files`
    : "";
  menuItems[6].innerText = node.dataset.totalAlbums
    ? `${node.dataset.totalAlbums} albums`
    : "";
};

/**
 * Return a new <svg> HTML Element "hamburger menu icon".
 */
const createHamburgerMenu = () => {
  const menuIcon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );

  menuIcon.setAttribute("width", "20");
  menuIcon.setAttribute("height", "12");

  const r1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r1.setAttribute("width", "20");
  r1.setAttribute("height", "2");
  menuIcon.appendChild(r1);

  const r2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r2.setAttribute("y", "5");
  r2.setAttribute("width", "20");
  r2.setAttribute("height", "2");
  menuIcon.appendChild(r2);

  const r3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r3.setAttribute("y", "10");
  r3.setAttribute("width", "20");
  r3.setAttribute("height", "2");
  menuIcon.appendChild(r3);

  return menuIcon;
};

/**
 * Return true if library_finder was run with the --files argument, else false.
 * @param {Object} elements The HTML elements object
 */
const commandlineFilesFlag = (elements) => {
    const args = elements.command.dataset.command.split(" ");
    return args.includes("--files");
}

/**
 * Return a new <h3> HTML element containing the arguments given to
 * library_finder.
 * @param {Object} elements The HTML elements object.
 */
const commandline = (elements) => {
  const commandline = document.createElement("h3");
  commandline.setAttribute("id", "command-subtitle");
  commandline.innerText = "library_finder " + elements.command.dataset.command;
  return commandline;
};

/**
 * Return a new <div> HTML element containing the content for the "Help"
 * sidebar.
 */
const helpContent = () => {
  const helpContent = document.createElement("div");
  helpContent.setAttribute("id", "guide-container");
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
            <li><code>--html</code><br>Output results to ./library_explorer.html instead of printing to terminal.</li>
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
};

/**
 * Return a new <div> HTML element containing the content for the "About"
 * sidebar.
 */
const aboutContent = () => {
  const aboutContent = document.createElement("div");
  aboutContent.setAttribute("id", "about-container");
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
        `;
  aboutContent.appendChild(footerContent());
  return aboutContent;
};

const newHtml = `
    <div id="disabler"></div>
    <div id="library-item-modal" class="hide-modal">
        <div class="modal-menu-item always-hidden"></div>
        <div class="modal-menu-item"></div>
        <hr>
        <textarea readonly class="modal-menu-item"></textarea>
        <div class="modal-menu-item">
            <a>Copy full path to clipboard</a>
            |
            <a target="_blank" href="#">Open folder in new tab</a>
        </div>
        <hr>
        <div class="modal-menu-item"></div>
        <div class="modal-menu-item"></div>
        <div class="modal-menu-item"></div>
    </div>
    <div class="navbar">
        <div id="nav-header">
            <div id="nav-menu">
                <h1 id="title">library_explorer</h1>
                <div class="nav-menu-button" id="insights-button">insights</div>
                <div class="nav-menu-button" id="help-button">help</div>
                <div class="nav-menu-button" id="about-button">about</div>
            </div>
            <div class="search-box">
                <div class="search-nav">
                    <input type="text" class="search-text" id="search-text"
                        label="search for album, artist, song, or folder"
                        placeholder="search for album, artist, song, or folder">
                    <input disabled="true" type="button" id="find-previous" 
                        class="search-button" value="&#8896;">
                    <input disabled="true" type="button" id="find-next"
                        class="search-button" value="&#8897;">
                </div>
                <div id="search-results"></div>
            </div>
        </div>
        <div id="full-path-display"></div>
        <div id="command-subtitle-container"></div>
    </div>
    <div id="help" class="guide"></div>
    <div id="about" class="guide"></div>
    `;

/**
 * Return a new <div> HTML element containing the "footer" text and elements.
 */
const footerContent = () => {
  const footerContent = document.createElement("div");
  footerContent.innerHTML = `
        Copyright &copy 2020 J.P. Hutchins.  GNU General Public License.
        <br>
        jphutchins@gmail.com
        <br>
        ${githubLink}
        ${linkedInLink}
    `;
  return footerContent;
};

/**
 * Return a new <div> HTML element with an X icon for use as a "close" button.
 * The div has belongs to the the class "close-sidebar-button".
 */
const closeSidebarButton = () => {
  const button = document.createElement("div");
  button.setAttribute("class", "close-sidebar-button");
  button.innerHTML = `${closeIcon}`;
  return button;
};

const pathIcon = `<svg class="list-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 54 54" style="enable-background:new 0 0 54 54;" xml:space="preserve">
<g>
	<path d="M53,10.5H23.535l-3.703-5.555C19.646,4.667,19.334,4.5,19,4.5H1c-0.552,0-1,0.447-1,1v6v4v29.003
		C0,47.259,2.24,49.5,4.994,49.5h44.012C51.76,49.5,54,47.259,54,44.503V15.5v-4C54,10.947,53.552,10.5,53,10.5z M52,14.5H2v-2h21
		h29V14.5z M2,6.5h16.465l2.667,4H2V6.5z M52,44.503c0,1.652-1.343,2.997-2.994,2.997H4.994C3.343,47.5,2,46.155,2,44.503V16.5h50
		V44.503z"/>
</g>
</svg>`;

const albumIcon = `
<svg class="list-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 465 465" style="enable-background:new 0 0 465 465;" xml:space="preserve">
<g>
	<path d="M396.94,68.06C353.052,24.171,294.652,0,232.5,0S111.948,24.171,68.06,68.06C24.171,111.949,0,170.348,0,232.5
		s24.171,120.551,68.06,164.44C111.948,440.829,170.348,465,232.5,465s120.552-24.171,164.44-68.06
		C440.829,353.051,465,294.652,465,232.5S440.829,111.949,396.94,68.06z M232.5,450C112.57,450,15,352.43,15,232.5
		S112.57,15,232.5,15S450,112.57,450,232.5S352.43,450,232.5,450z"/>
	<path d="M232.5,412.5c-99.252,0-180-80.748-180-180c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5
		c0,52.127,20.272,101.107,57.083,137.917c36.81,36.81,85.79,57.083,137.917,57.083c4.143,0,7.5-3.358,7.5-7.5
		S236.643,412.5,232.5,412.5z"/>
	<path d="M232.5,52.5c42.792,0,84.245,15.24,116.722,42.912c1.412,1.203,3.141,1.792,4.86,1.792c2.121,0,4.229-0.895,5.713-2.636
		c2.687-3.153,2.308-7.887-0.845-10.573C323.762,54.012,278.854,37.5,232.5,37.5c-4.143,0-7.5,3.358-7.5,7.5
		S228.357,52.5,232.5,52.5z"/>
	<path d="M381.008,106.053c-2.687-3.153-7.42-3.531-10.573-0.845c-3.152,2.687-3.531,7.42-0.845,10.573
		c27.671,32.477,42.91,73.928,42.91,116.719c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5
		C427.5,186.147,410.988,141.241,381.008,106.053z"/>
	<path d="M232.5,75c-4.143,0-7.5,3.358-7.5,7.5s3.357,7.5,7.5,7.5C311.075,90,375,153.925,375,232.5c0,4.142,3.357,7.5,7.5,7.5
		s7.5-3.358,7.5-7.5c0-42.103-16.374-81.663-46.105-111.395S274.603,75,232.5,75z"/>
	<path d="M163.958,374.368c1.052,0.508,2.164,0.75,3.26,0.75c2.786,0,5.463-1.56,6.757-4.237c1.804-3.729,0.242-8.214-3.487-10.017
		C120.841,336.86,90,287.675,90,232.5c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5c0,30.195,8.553,59.525,24.732,84.819
		C115.482,341.941,137.691,361.668,163.958,374.368z"/>
	<path d="M232.5,375c-11.938,0-23.799-1.474-35.25-4.382c-4.012-1.02-8.096,1.409-9.115,5.424s1.409,8.096,5.424,9.115
		C206.216,388.371,219.317,390,232.5,390c4.143,0,7.5-3.358,7.5-7.5S236.643,375,232.5,375z"/>
	<path d="M232.5,337.5c-29.979,0-58.59-12.839-78.499-35.224c-2.754-3.094-7.493-3.373-10.589-0.62
		c-3.095,2.752-3.373,7.493-0.62,10.588c22.753,25.583,55.45,40.255,89.708,40.255c4.143,0,7.5-3.358,7.5-7.5
		S236.643,337.5,232.5,337.5z"/>
	<path d="M131.624,289.889c1.117,0,2.252-0.25,3.321-0.78c3.712-1.837,5.232-6.336,3.395-10.048
		c-7.192-14.534-10.84-30.199-10.84-46.561c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5c0,18.69,4.171,36.594,12.396,53.214
		C126.204,288.357,128.861,289.889,131.624,289.889z"/>
	<path d="M232.5,112.5c-4.143,0-7.5,3.358-7.5,7.5s3.357,7.5,7.5,7.5c57.897,0,105,47.103,105,105c0,4.142,3.357,7.5,7.5,7.5
		s7.5-3.358,7.5-7.5C352.5,166.332,298.668,112.5,232.5,112.5z"/>
	<path d="M232.5,212.5c-11.028,0-20,8.972-20,20s8.972,20,20,20s20-8.972,20-20S243.528,212.5,232.5,212.5z M232.5,237.5
		c-2.757,0-5-2.243-5-5s2.243-5,5-5s5,2.243,5,5S235.257,237.5,232.5,237.5z"/>
	<path d="M232.5,149.5c-45.767,0-83,37.234-83,83s37.233,83,83,83s83-37.234,83-83S278.267,149.5,232.5,149.5z M232.5,300.5
		c-37.495,0-68-30.505-68-68s30.505-68,68-68s68,30.505,68,68S269.995,300.5,232.5,300.5z"/>
</g>
</svg>
`;

const collectionIcon = `
<svg class="list-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 60.02 60.02" style="enable-background:new 0 0 60.02 60.02;" xml:space="preserve">
<g>
	<path d="M59.766,15.896l-0.363-0.386h-1.837l0.409-3.34c0.043-0.424-0.097-0.848-0.382-1.163c-0.286-0.315-0.694-0.497-1.12-0.497
		h-2.437V7c0-0.821-0.669-1.49-1.491-1.49h-2.509V2c0-0.821-0.669-1.49-1.491-1.49H11.526c-0.821,0-1.49,0.669-1.49,1.49v3.51h-2.51
		c-0.821,0-1.49,0.669-1.49,1.49v3.51H3.599c-0.426,0-0.834,0.182-1.12,0.497c-0.285,0.315-0.425,0.739-0.379,1.185l0.406,3.318
		h-1.37c-0.321,0-0.623,0.141-0.83,0.386L0,16.306l5.959,41.856c0.138,0.781,0.813,1.348,1.605,1.348h44.942
		c0.791,0,1.467-0.565,1.611-1.38l5.886-41.352C60.059,16.462,59.972,16.141,59.766,15.896z M12.036,2.51h36v3h-36V2.51z
		 M8.036,7.51h2h40h2v3h-44V7.51z M4.153,12.51h1.883h48h1.882l-0.367,3H4.521L4.153,12.51z M52.187,57.51H7.886l-5.695-40h0.561
		H57.32h0.56L52.187,57.51z"/>
	<path d="M29.536,20.51c-11.304,0-20.5,7.626-20.5,17s9.196,17,20.5,17s20.5-7.626,20.5-17S40.84,20.51,29.536,20.51z M29.536,52.51
		c-10.201,0-18.5-6.729-18.5-15s8.299-15,18.5-15s18.5,6.729,18.5,15S39.737,52.51,29.536,52.51z"/>
	<path d="M30.536,25.449c0-0.553-0.447-1-1-1c-3.993,0-7.778,1.21-10.946,3.499c-0.447,0.323-0.548,0.948-0.225,1.396
		c0.195,0.271,0.501,0.414,0.812,0.414c0.203,0,0.407-0.062,0.585-0.189c2.824-2.041,6.204-3.12,9.774-3.12
		C30.089,26.449,30.536,26.002,30.536,25.449z"/>
	<path d="M30.536,29.2c0-0.553-0.447-1-1-1c-3.105,0-6.049,0.941-8.512,2.723c-0.447,0.324-0.548,0.949-0.225,1.396
		c0.196,0.271,0.501,0.414,0.812,0.414c0.203,0,0.408-0.062,0.585-0.189c2.12-1.533,4.658-2.344,7.34-2.344
		C30.089,30.2,30.536,29.753,30.536,29.2z"/>
	<path d="M30.536,32.95c0-0.553-0.447-1-1-1c-2.229,0-4.339,0.68-6.104,1.967c-0.446,0.325-0.545,0.95-0.219,1.396
		c0.195,0.269,0.5,0.411,0.809,0.411c0.204,0,0.41-0.063,0.588-0.192c1.42-1.035,3.124-1.582,4.926-1.582
		C30.089,33.95,30.536,33.503,30.536,32.95z"/>
	<path d="M39.4,45.638c-2.824,2.042-6.204,3.121-9.774,3.121c-0.553,0-1,0.447-1,1s0.447,1,1,1c3.994,0,7.779-1.21,10.946-3.5
		c0.447-0.324,0.548-0.949,0.225-1.396C40.474,45.414,39.847,45.314,39.4,45.638z"/>
	<path d="M28.626,46.008c0,0.553,0.447,1,1,1c3.106,0,6.05-0.942,8.512-2.724c0.448-0.324,0.548-0.949,0.225-1.396
		c-0.325-0.448-0.95-0.548-1.396-0.225c-2.119,1.534-4.657,2.345-7.34,2.345C29.073,45.008,28.626,45.455,28.626,46.008z"/>
	<path d="M28.626,42.257c0,0.553,0.447,1,1,1c2.23,0,4.341-0.68,6.104-1.967c0.445-0.325,0.544-0.951,0.218-1.397
		c-0.324-0.444-0.949-0.544-1.397-0.218c-1.418,1.035-3.121,1.582-4.925,1.582C29.073,41.257,28.626,41.704,28.626,42.257z"/>
	<ellipse cx="29.932" cy="37.494" rx="2.327" ry="1.689"/>
</g>
</svg>
`;

const libraryIcon = `<svg class="list-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
viewBox="0 0 508 508" style="enable-background:new 0 0 508 508;" xml:space="preserve">

<g>
   <path d="M493.949,0h-479.8c-7.8,0-14.1,6.3-14.1,14.1v464.1c0,7.8,6.3,14.1,14.1,14.1h24v1.6c0,7.8,6.3,14.1,14.1,14.1
       s14.1-6.3,14.1-14.1v-1.6h375.3v1.6c0,7.8,6.3,14.1,14.1,14.1c7.8,0,14.1-6.3,14.1-14.1v-1.6h24c7.8,0,14.1-6.3,14.1-14.1V14.1
       C508.049,6.3,501.749,0,493.949,0z M479.849,464.1L479.849,464.1h-451.6V337.6h451.6V464.1z M176.649,309.4v-85.5l29.8,85.5
       H176.649z M479.849,309.4L479.849,309.4h-243.5l-34.5-99.2l-25.1,8.7v-7.2h-28.2v97.7h-15.6v-97.7h-28.2v97.7h-15.8v-97.7h-28.2
       v97.7h-32.5V182.9h451.6V309.4z M479.849,154.7L479.849,154.7h-347V57h-28.2v97.7h-15.7V57h-28.2v97.7h-32.5V28.2h451.6V154.7z"/>
</g>
</svg>

`;

const linkedInIcon = `<svg width="50" height="50" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="linkedin" class="icon svg-inline--fa fa-linkedin fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>`;
const githubIcon = `<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github-square" class="icon svg-inline--fa fa-github-square fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM277.3 415.7c-8.4 1.5-11.5-3.7-11.5-8 0-5.4.2-33 .2-55.3 0-15.6-5.2-25.5-11.3-30.7 37-4.1 76-9.2 76-73.1 0-18.2-6.5-27.3-17.1-39 1.7-4.3 7.4-22-1.7-45-13.9-4.3-45.7 17.9-45.7 17.9-13.2-3.7-27.5-5.6-41.6-5.6-14.1 0-28.4 1.9-41.6 5.6 0 0-31.8-22.2-45.7-17.9-9.1 22.9-3.5 40.6-1.7 45-10.6 11.7-15.6 20.8-15.6 39 0 63.6 37.3 69 74.3 73.1-4.8 4.3-9.1 11.7-10.6 22.3-9.5 4.3-33.8 11.7-48.3-13.9-9.1-15.8-25.5-17.1-25.5-17.1-16.2-.2-1.1 10.2-1.1 10.2 10.8 5 18.4 24.2 18.4 24.2 9.7 29.7 56.1 19.7 56.1 19.7 0 13.9.2 36.5.2 40.6 0 4.3-3 9.5-11.5 8-66-22.1-112.2-84.9-112.2-158.3 0-91.8 70.2-161.5 162-161.5S388 165.6 388 257.4c.1 73.4-44.7 136.3-110.7 158.3zm-98.1-61.1c-1.9.4-3.7-.4-3.9-1.7-.2-1.5 1.1-2.8 3-3.2 1.9-.2 3.7.6 3.9 1.9.3 1.3-1 2.6-3 3zm-9.5-.9c0 1.3-1.5 2.4-3.5 2.4-2.2.2-3.7-.9-3.7-2.4 0-1.3 1.5-2.4 3.5-2.4 1.9-.2 3.7.9 3.7 2.4zm-13.7-1.1c-.4 1.3-2.4 1.9-4.1 1.3-1.9-.4-3.2-1.9-2.8-3.2.4-1.3 2.4-1.9 4.1-1.5 2 .6 3.3 2.1 2.8 3.4zm-12.3-5.4c-.9 1.1-2.8.9-4.3-.6-1.5-1.3-1.9-3.2-.9-4.1.9-1.1 2.8-.9 4.3.6 1.3 1.3 1.8 3.3.9 4.1zm-9.1-9.1c-.9.6-2.6 0-3.7-1.5s-1.1-3.2 0-3.9c1.1-.9 2.8-.2 3.7 1.3 1.1 1.5 1.1 3.3 0 4.1zm-6.5-9.7c-.9.9-2.4.4-3.5-.6-1.1-1.3-1.3-2.8-.4-3.5.9-.9 2.4-.4 3.5.6 1.1 1.3 1.3 2.8.4 3.5zm-6.7-7.4c-.4.9-1.7 1.1-2.8.4-1.3-.6-1.9-1.7-1.5-2.6.4-.6 1.5-.9 2.8-.4 1.3.7 1.9 1.8 1.5 2.6z"></path></svg>`;
const closeIcon = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="times" class="svg-inline--fa fa-times fa-w-11" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg>`;

const linkedInLink = `<a class="icon-link" href="https://www.linkedin.com/in/j-p-hutchins-17357547" target="_blank" rel="noreferrer">${linkedInIcon}</a>`;
const githubLink = `<a class="icon-link" href="https://github.com/JPHutchins" target="_blank" rel="noreferrer">${githubIcon}</a>`;
