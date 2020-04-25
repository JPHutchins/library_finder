R"=====(


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
    `

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
)====="