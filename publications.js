/* One directory powers filtering, numbering, and the homepage snapshot. */
(async function () {
    let records = window.PUBLICATIONS || [];
    if (location.protocol !== 'file:') {
        try {
            const response = await fetch('/api/publications');
            if (response.ok) records = await response.json();
        } catch (_) { /* The bundled directory also works on static hosting. */ }
    }
    records.sort((a, b) => b.year - a.year || a.id - b.id);
    const make = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };
    const citation = r => [r.venue, r.volume && `Vol. ${r.volume}`,
        r.issue && `No. ${r.issue}`, r.pages && `pp. ${r.pages}`, r.year].filter(Boolean).join(', ');
    const snapshot = document.querySelector('#quick-pubs-modal .quick-pubs-list');
    if (snapshot) snapshot.replaceChildren(...records.slice(0, 7).map(r => make('li', '', `${r.authors}. “${r.title}.” ${citation(r)}.`)));
    const list = document.getElementById('publication-list');
    if (!list) return;
    const search = document.getElementById('publication-search');
    const count = document.getElementById('publication-count');
    let topic = 'all';
    function render() {
        const query = search.value.trim().toLowerCase();
        const filtered = records.filter(r => (topic === 'all' || r.kind === topic || r.topics.includes(topic)) &&
            `${r.authors} ${r.title} ${r.venue} ${r.year}`.toLowerCase().includes(query));
        list.replaceChildren();
        for (const [kind, label] of [['journals', 'Journals / Transactions'], ['conferences', 'Conferences'], ['books', 'Books & Magazines']]) {
            const group = filtered.filter(r => r.kind === kind);
            if (!group.length) continue;
            list.append(make('h4', '', label));
            group.forEach(r => {
                const item = make('article', 'pub-item');
                item.classList.toggle('is-prestigious', r.prestigious);
                const details = make('div', 'pub-details');
                // Keep citation numbers stable while filtering; recalculate after data changes.
                details.append(make('p', 'pub-authors', `[${records.indexOf(r) + 1}] ${r.authors}`));
                const title = make('p', 'pub-title');
                if (/^https?:\/\//i.test(r.url || '')) {
                    const link = make('a', '', r.title); link.href = r.url;
                    link.target = '_blank'; link.rel = 'noopener noreferrer'; title.append(link);
                } else title.textContent = r.title;
                details.append(title, make('p', 'pub-venue', citation(r)));
                const tags = make('div', 'pub-tags');
                if (r.prestigious) tags.append(make('span', '', 'Prestigious journal'));
                if (r.sci) tags.append(make('span', '', 'SCI indexed'));
                if (r.impact_factor !== '') tags.append(make('span', '', `Impact factor: ${r.impact_factor}`));
                if (r.comment) tags.append(make('span', '', r.comment));
                details.append(tags);
                item.append(make('span', 'pub-year', r.year), details); list.append(item);
            });
        }
        if (!filtered.length) list.append(make('p', '', 'No publications match your search.'));
        count.textContent = `${filtered.length} of ${records.length} selected publications`;
    }
    document.querySelectorAll('.pub-topics .tab-btn').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.target === 'all'));
        button.addEventListener('click', () => {
            topic = button.dataset.target;
            document.querySelectorAll('.pub-topics .tab-btn').forEach(tab => {
                tab.classList.toggle('active', tab === button);
                tab.setAttribute('aria-pressed', String(tab === button));
            });
            render();
        });
    });
    search.addEventListener('input', render);
    render();
})();
