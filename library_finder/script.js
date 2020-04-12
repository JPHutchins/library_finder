window.onload = () => {
    /*-------------------------------------------------------------------------
        Add DOM elements and styling, initialize state, and set handlers.
    -------------------------------------------------------------------------*/
    const libraryExplorer = document.getElementById('library-explorer');
    const rootInfo = libraryExplorer.children[0].dataset;

    organizeAlbums(libraryExplorer.children[0].children[0]);

    libraryExplorer.getElementsByTagName('UL')[0].classList.add("show-list");
    libraryExplorer.getElementsByTagName('UL')[0].classList.add("fade");

    if (document.querySelectorAll) {
        document.querySelectorAll(".library-item").forEach((elem) => {
            insertHoverDetailsBeforeUL(elem);
            styleTheListElement(elem, rootInfo)
        });
    }

    document.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!e.target) return;
        if (e.target.classList.contains("library-item")) dropDownDirectory(e);
    });
}

/*-----------------------------------------------------------------------------
    Utility functions.
-----------------------------------------------------------------------------*/

/**
 * Toggles visibility of a target <ul> by toggling the class "show-list".
 * @param {Event} e The event.
 */
const dropDownDirectory = (e) => {
    const toggleShow = toggleClassName("show-list");
    for (const child of e.target.children) {
        if (child === undefined) continue;
        toggleShow(child);
    };
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
        elem.style.backgroundColor = `rgba(255, 240, 230)`;
        elem.style.borderColor = `rgba(230, 200, 200)`;
        return;
    }
    else if (!elem.classList.contains("library-item")) return;

    const albums = elem.dataset.totalAlbums;

    const minPercent = .002;
    const percent = Math.max(albums / rootInfo.totalAlbums, minPercent);
    const green = (255 - 255 * Math.log2(percent)) * 0.1;
    const blue = (200 - .5 * green);
    const red = 255;

    elem.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, 1)`;
    elem.style.borderColor =
        `rgba(${red - 100}, ${green + 50}, ${blue + 200}, 1)`
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
const hoverDetails = (li) => {
    const newSpan = document.createElement("span");
    let text;
    if (li.classList.contains("library")) {
        text =
            `${li.dataset.totalAlbums} albums,
            ${li.dataset.totalAudioFiles} tracks`;
    }
    else if (li.classList.contains("collection")) {
        text =
            `${li.dataset.totalAlbums} albums,
            ${li.dataset.totalAudioFiles} tracks`;
    }
    else if (li.classList.contains("album")) {
        text =
            `${li.dataset.containedAudioFiles} tracks`;
    }
    else if (li.classList.contains("path")) {
        text =
            `${li.dataset.totalAlbums} albums,
            ${li.dataset.totalAudioFiles} tracks`;
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

