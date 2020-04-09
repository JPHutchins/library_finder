document.addEventListener('click', (e) => {
        if (!e.target) return;
        if (e.target && e.target.nodeName != "LI") return;
        e.stopPropagation(); 
		const items = e.target.children; 
		for (const item of items) { 
			if (item === undefined) continue; 
			if (item.tagName === "LI") continue; 
			if (item.style.display === "block") item.style.display = "none"; 
				else item.style.display = "block"; };
    }); 