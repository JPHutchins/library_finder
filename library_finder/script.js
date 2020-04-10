
window.onload = () => {
	const libraryExplorer = document.getElementById('library-explorer');
	libraryExplorer.getElementsByTagName('UL')[0].style.display = "block";
	const newSpan = document.createElement("span");
	const newLabel = document.createElement("label")
	newLabel.setAttribute("class", "switch");
	const newInput = document.createElement("input")
	newInput.setAttribute("type", "checkbox");
	newInput.setAttribute("id", "toggle-albums");
	const newSlider = document.createElement("span");
	newSlider.setAttribute("class", "slider");
	newLabel.appendChild(newInput);
	newLabel.appendChild(newSlider);
	newSpan.appendChild(newLabel);
	libraryExplorer.insertBefore(newSpan, libraryExplorer.children[0]);

	document.getElementById('toggle-albums').addEventListener('change', (e) => {
		e.target.checked ? showAlbums(true) : showAlbums(false);
	})

	document.getElementById('toggle-albums').checked ? showAlbums(true) : showAlbums(false);
	const lis = document.getElementsByTagName("LI");
	for (li of lis) {
		const albums = li.dataset.totalAlbums;
		if (!albums) {
			li.style.backgroundColor = `rgba(255, 240, 230)`;
			continue;
		}

		const minPercent = .004;
		const percent = Math.max(albums / 1134, minPercent);
		const green = (255 - 255 * Math.log2(percent)) * 0.1;
		const blue = 150 - 0.75*green;
		const red = 255;

		li.style.backgroundColor = `rgba(${red}, ${green}, ${blue})`;
	}
}

document.addEventListener('click', (e) => {
	if (!e.target) return;
	if (e.target && e.target.nodeName != "LI") return;
	e.stopPropagation();
	const items = e.target.children;
	let display;
	for (const item of items) {
		if (item === undefined) continue;
		if (item.tagName === "LI") continue;
		if (item.style.display === "block") {
			display = "none"
			item.style.display = display;
		} else {
			display = "block"
			item.style.display = display;
		}
		for (li of item.children) {
			if (li.className != "album") {
				continue;
			}
			li.style.display = display;
		}
	};
});

const showAlbums = (yes) => {
	const lis = document.getElementsByClassName("album");
	const display = yes ? "block" : "none";
	for (li of lis) {
		li.style.display = display;
	}
}