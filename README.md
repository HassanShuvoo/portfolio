# Professor Bhuiyan website

Run the website with Python 3.10 or newer (no packages to install):

```powershell
python server.py
```

Open `http://127.0.0.1:8000`. Stop the server with Ctrl+C.

## Publications and contact inbox

Open `http://127.0.0.1:8000/admin.html` and enter the administrator token printed in the server terminal. A new token is generated at each start; optionally set `WEBSITE_ADMIN_TOKEN` to your own strong secret before starting the server. The editor keeps this token in memory only. Locking the editor or reloading the page clears it.

For the preview started during this update, its session token is in `.review/preview-server.log`.

- Add, edit, or delete publications. Authors, title, venue, year, type, topics, volume, issue, pages, journal recognition, impact factor, comments, and a publication URL are supported.
- Citation numbers are computed from the complete directory, newest year first, then insertion order. Filtering preserves those numbers.
- The public directory and homepage publication snapshot read the database on page load. Reload an open public page after editing.
- Contact submissions are saved in the editor's private inbox. They do **not** send an email notification.
- Export JSON downloads a copy of the publication records.

The SQLite database is created at `.site-data/website.sqlite3`. Back up `.site-data` after stopping the server. Publications are seeded from `data/publications.json` only when the database is first created. Editing the seed file does not overwrite an existing database.

## Hosting and static preview

The included server is a **local preview and editing server**, bound to `127.0.0.1`. Public deployment still needs a hosting choice and a production HTTPS application server, authentication configuration, and a persistent database location. The current origin checks intentionally accept localhost only.

Opening `index.html` directly or using static hosting displays the bundled publication snapshot in `publications-data.js`. The editor and contact storage require the Python server. If storage is unavailable, the contact form preserves the draft and directs the visitor to email; it never reports a false success.

Only public HTML, CSS, JavaScript, and image assets are served. The database, source video, review files, and Python sources cannot be downloaded through the included server. Do not publish the entire workspace directory through an unrestricted static server.

## Remaining content

The original website supplied seven named publications and example conference/book records. The directory includes the seven named records; the placeholder titles and sample volume/page fields were removed. The existing career impact figures are retained as supplied and are not calculated from this selected list.

Verified LinkedIn and DBLP links appear on Home and Contact. Exact Google Scholar and Facebook profile URLs were not supplied or verified, so they remain pending. Add them to the `.profile-links` block in `index.html` and `contact.html` when available. No office hours were supplied; the existing office addresses and contact labels are highlighted without inventing a schedule.

## Verification

```powershell
python -m unittest discover -s tests -v
node --check script.js
node --check publications.js
node --check admin.js
```

The backend tests use a separate temporary database. The video checklist is in [Instructions/IMPLEMENTATION.md](Instructions/IMPLEMENTATION.md). Original files and local review evidence are retained in `.review/` and are not part of the public website.
