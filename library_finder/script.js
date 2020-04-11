window.onload = () => {
	const libraryExplorer = document.getElementById('library-explorer');

	organizeAlbums(libraryExplorer.children[0].children[0]);

	libraryExplorer.getElementsByTagName('UL')[0].classList.add("show-list");
	libraryExplorer.getElementsByTagName('UL')[0].classList.add("fade");

	const lis = document.getElementsByTagName("LI");
	for (li of lis) {

		ul = li.getElementsByTagName("UL")[0];
		li.insertBefore(hoverDetails(li), ul)

		const albums = li.dataset.totalAlbums;
		if (!albums) {
			li.style.backgroundColor = `rgba(255, 240, 230)`;
			li.style.borderColor = `rgba(230, 200, 200)`;
			continue;
		}

		const minPercent = .002;
		const percent = Math.max(albums / 1134, minPercent);
		const green = (255 - 255 * Math.log2(percent)) * 0.1;
		const blue = (200 - .5 * green);
		const red = 255;

		li.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, 1)`;
		li.style.borderColor = `rgba(${red - 100}, ${green + 50}, ${blue + 200}, 1)`
	}

	document.addEventListener('click', (e) => {
		if (!e.target) return;
		if (e.target && e.target.nodeName != "LI") return;
		e.stopPropagation();

		const toggleShow = toggleClassName("show-list");
		for (const child of e.target.children) {
			if (child === undefined) continue;
			toggleShow(child);
		};
	});
}

/**
 * Takes an <li> and formats its attributes. Returns a new <span> to be appended under the <li>.
 * 
 * @param {HTMLElement} li The <li> that needs hover details added.
 */
const hoverDetails = (li) => {
	const newSpan = document.createElement("span");
	let text;
	if (li.classList.contains("library")) {
		text = `${li.dataset.totalAlbums} albums, ${li.dataset.totalAudioFiles} tracks`;
	}
	else if (li.classList.contains("collection")) {
		text = `${li.dataset.totalAlbums} albums, ${li.dataset.totalAudioFiles} tracks`;
	}
	else if (li.classList.contains("album")) {
		text = `${li.dataset.containedAudioFiles} tracks`;
	}
	else if (li.classList.contains("path")) {
		text = `${li.dataset.totalAlbums} albums, ${li.dataset.totalAudioFiles} tracks`;
	}
	newSpan.innerText = text;
	newSpan.setAttribute("class", "hover-details");
	return newSpan;
}

/**
 * Returns a function that toggles the class name on and off.
 * 
 * @param {String} className The class name to toggle on and off.
 */
const toggleClassName = (className) => (element) => {
	return element.classList.toggle(className);
}

/**
 * Moves <li> with the class name "album" to the bottom of its parent <ul>.
 * 
 * Imitative of OS file explorers displaying subdfolders at the top of each directory
 * followed by files. Note that thes <li> albums do represent real folders on the
 * file system.
 * 
 * @param {HTMLElement} elem The root node at which to start the DFS organization. 
 */
const organizeAlbums = (elem) => {
	if (elem === undefined) return;

	const stack = new Array;
	for (child of elem.children) {
		if (child.className.indexOf("album") === -1) {
			organizeAlbums(child.children[0]);
			continue;
		}
		stack.push(child);
	}
	for (child of stack) {
		elem.appendChild(child);
	}
}

