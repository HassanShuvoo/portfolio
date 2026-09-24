(() => {
    let token = '';
    let records = [];
    const status = document.getElementById('admin-status');
    const editor = document.getElementById('publication-editor');
    const workspace = document.getElementById('admin-workspace');
    const login = document.getElementById('admin-login');
    const make = (tag, text) => {
        const element = document.createElement(tag); element.textContent = text; return element;
    };
    const tell = (text, error = false) => {
        status.textContent = text; status.className = error ? 'form-status error' : 'form-status';
    };
    async function api(path, options = {}) {
        const response = await fetch(path, {...options, headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}});
        let data;
        try { data = await response.json(); } catch (_) { throw new Error('Start the website with python server.py to use the editor.'); }
        if (!response.ok) throw new Error(data.error || 'Request failed.');
        return data;
    }
    function loadIntoForm(record) {
        editor.reset();
        for (const [name, value] of Object.entries(record)) {
            if (name === 'topics') {
                editor.querySelectorAll('[name="topics"]').forEach(input => input.checked = value.includes(input.value));
            } else {
                const input = editor.elements.namedItem(name);
                if (input) { if (input.type === 'checkbox') input.checked = value; else input.value = value; }
            }
        }
        editor.elements.authors.focus();
        tell('Editing publication. Save to apply your changes.');
    }
    async function refreshRecords() {
        records = await api('/api/publications');
        const container = document.getElementById('editor-records'); container.replaceChildren();
        records.forEach((record, index) => {
            const row = make('article', ''); row.className = 'editor-record';
            row.append(make('h3', `[${index + 1}] ${record.title}`), make('p', `${record.venue} · ${record.year}`));
            const edit = make('button', 'Edit'); edit.className = 'btn secondary-btn';
            edit.addEventListener('click', () => loadIntoForm(record));
            const remove = make('button', 'Delete'); remove.className = 'btn secondary-btn';
            remove.addEventListener('click', async () => {
                if (!confirm(`Delete “${record.title}”?`)) return;
                remove.disabled = true;
                try {
                    await api(`/api/publications/${record.id}`, {method: 'DELETE'});
                    if (editor.elements.id.value === String(record.id)) editor.reset();
                    await refreshRecords(); tell('Publication deleted. Citation numbers updated.');
                } catch (error) { tell(error.message, true); remove.disabled = false; }
            });
            row.append(edit, remove); container.append(row);
        });
    }
    async function refreshInbox() {
        const messages = await api('/api/messages');
        const inbox = document.getElementById('editor-inbox'); inbox.replaceChildren();
        if (!messages.length) inbox.append(make('p', 'No messages yet.'));
        messages.forEach(message => {
            const row = make('article', ''); row.className = 'editor-record';
            row.append(make('h3', message.subject), make('p', `${message.name} <${message.email}> · ${message.created_at} UTC`));
            const content = make('p', message.content); content.className = 'message-content'; row.append(content); inbox.append(row);
        });
    }
    login.addEventListener('submit', async event => {
        event.preventDefault(); token = document.getElementById('admin-token').value;
        try {
            await refreshInbox(); await refreshRecords();
            workspace.hidden = false; login.hidden = true; document.getElementById('admin-token').value = '';
            tell('Editor unlocked.');
        } catch (error) { token = ''; tell(error.message, true); }
    });
    document.getElementById('admin-lock').addEventListener('click', () => {
        token = ''; records = []; editor.reset(); workspace.hidden = true; login.hidden = false;
        document.getElementById('editor-inbox').replaceChildren();
        document.getElementById('editor-records').replaceChildren(); tell('Editor locked.');
    });
    editor.addEventListener('reset', () => { editor.elements.id.value = ''; });
    editor.addEventListener('submit', async event => {
        event.preventDefault();
        const button = editor.querySelector('[type="submit"]'); button.disabled = true;
        const form = new FormData(editor); const data = Object.fromEntries(form);
        const id = data.id; delete data.id;
        data.year = Number(data.year); data.topics = form.getAll('topics');
        data.prestigious = form.has('prestigious'); data.sci = form.has('sci');
        try {
            await api('/api/publications' + (id ? '/' + id : ''), {method: id ? 'PUT' : 'POST', body: JSON.stringify(data)});
            editor.reset(); await refreshRecords(); tell('Publication saved. The public directory is updated.');
        } catch (error) { tell(error.message, true); }
        finally { button.disabled = false; }
    });
    document.getElementById('refresh-inbox').addEventListener('click', () => refreshInbox().catch(error => tell(error.message, true)));
    document.getElementById('export-publications').addEventListener('click', () => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], {type: 'application/json'}));
        const link = document.createElement('a'); link.href = url; link.download = 'publications.json'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
})();
