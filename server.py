"""Local website preview, publication editor, and persistent contact inbox.

Run: python server.py. No third-party packages required.
"""
import argparse
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from collections import defaultdict, deque
from contextlib import closing, contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent
KINDS = {'journals', 'conferences', 'books'}
TOPICS = {'cyber', 'ai', 'wireless', 'iot'}


def validate_publication(data):
    if not isinstance(data, dict):
        raise ValueError('A publication object is required.')
    result = {}
    for field in ('authors', 'title', 'venue', 'volume', 'issue', 'pages', 'comment', 'impact_factor', 'url'):
        value = data.get(field, '')
        if not isinstance(value, str) or len(value) > 3000:
            raise ValueError(f'Invalid {field}.')
        result[field] = value.strip()
    if not all(result[f] for f in ('authors', 'title', 'venue')):
        raise ValueError('Authors, title, and venue are required.')
    year = data.get('year')
    if type(year) is not int or not 1900 <= year <= 2100:
        raise ValueError('Year must be between 1900 and 2100.')
    result['year'] = year
    if data.get('kind') not in KINDS:
        raise ValueError('Choose a publication type.')
    result['kind'] = data['kind']
    topics = data.get('topics', [])
    if not isinstance(topics, list) or any(not isinstance(t, str) or t not in TOPICS for t in topics):
        raise ValueError('Invalid topics.')
    result['topics'] = sorted(set(topics))
    for field in ('prestigious', 'sci'):
        if type(data.get(field, False)) is not bool:
            raise ValueError(f'Invalid {field} flag.')
        result[field] = data.get(field, False)
    if result['url'] and (urlsplit(result['url']).scheme not in ('http', 'https') or not urlsplit(result['url']).netloc):
        raise ValueError('Publication URL must start with http:// or https://.')
    if result['impact_factor'] and not re.fullmatch(r'\d{1,3}(\.\d{1,3})?', result['impact_factor']):
        raise ValueError('Impact factor must be a non-negative number.')
    return result


def initialize_database(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(path)) as db, db:
        db.execute('PRAGMA journal_mode=WAL')
        exists = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='publications'").fetchone()
        db.execute('CREATE TABLE IF NOT EXISTS publications (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)')
        if not exists:
            for item in json.loads((ROOT / 'data/publications.json').read_text(encoding='utf-8')):
                db.execute('INSERT INTO publications(id,data) VALUES (?,?)', (item['id'], json.dumps(validate_publication(item))))


class WebsiteServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, database, token):
        super().__init__(address, Handler)
        self.database = database
        self.token = token
        self.contacts = defaultdict(deque)
        self.rate_lock = threading.Lock()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, BrokenPipeError):
            # Browsers cancel preconnected sockets during navigation/shutdown.
            pass

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('X-Frame-Options', 'DENY')
        super().end_headers()

    def respond(self, status, data):
        # Consume a rejected small request before closing its connection (Windows
        # otherwise resets the socket before the caller can read the response).
        if self.command in ('POST', 'PUT', 'DELETE') and not getattr(self, '_body_read', False):
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if 0 < size <= 32000:
                    self.connection.settimeout(5)
                    self.rfile.read(size)
            except (ValueError, OSError):
                pass
            self._body_read = True
        payload = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(payload)

    def authorized(self):
        received = self.headers.get('Authorization', '')
        return hmac.compare_digest(received, 'Bearer ' + self.server.token)

    def same_origin(self):
        # Reject DNS rebinding and cross-site requests to this local admin service.
        host = self.headers.get('Host', '')
        allowed = {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'}
        return host in allowed and self.headers.get('Origin', 'http://' + host) == 'http://' + host

    @contextmanager
    def db(self):
        with closing(sqlite3.connect(self.server.database)) as db, db:
            yield db

    def publications(self):
        with self.db() as db:
            records = [dict(json.loads(data), id=key) for key, data in db.execute('SELECT id,data FROM publications')]
        return sorted(records, key=lambda item: (-item['year'], item['id']))

    def static_allowed(self):
        path = unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        resolved = (ROOT / path).resolve()
        if not resolved.is_relative_to(ROOT) or not resolved.is_file():
            return False
        if resolved.parent == ROOT:
            return resolved.suffix in {'.html', '.css', '.js', '.png'}
        return resolved.is_relative_to(ROOT / 'assets') and resolved.suffix.lower() in {'.png', '.jpg', '.jpeg', '.svg', '.webp'}

    def do_HEAD(self):
        if not self.static_allowed():
            return self.respond(404, {'error': 'Not found.'})
        super().do_HEAD()

    def do_GET(self):
        if not self.same_origin():
            return self.respond(403, {'error': 'Local access only.'})
        path = urlsplit(self.path).path
        if path == '/api/publications':
            return self.respond(200, self.publications())
        if path == '/api/messages':
            if not self.authorized():
                return self.respond(401, {'error': 'Enter the administrator token from the server terminal.'})
            with self.db() as db:
                db.row_factory = sqlite3.Row
                rows = [dict(row) for row in db.execute('SELECT * FROM messages ORDER BY id DESC')]
            return self.respond(200, rows)
        if path.startswith('/api/') or not self.static_allowed():
            return self.respond(404, {'error': 'Not found.'})
        super().do_GET()

    def read_json(self):
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            raise ValueError('JSON content is required.')
        size = int(self.headers.get('Content-Length', '0'))
        if not 0 < size <= 32000:
            raise ValueError('Request must be between 1 and 32000 bytes.')
        self._body_read = True
        value = json.loads(self.rfile.read(size))
        if not isinstance(value, dict):
            raise ValueError('A JSON object is required.')
        return value

    def do_POST(self):
        self.mutate()

    def do_PUT(self):
        self.mutate()

    def do_DELETE(self):
        self.mutate()

    def mutate(self):
        if not self.same_origin():
            return self.respond(403, {'error': 'Cross-origin requests are not allowed.'})
        path = urlsplit(self.path).path
        try:
            if path == '/api/contact' and self.command == 'POST':
                data = self.read_json()
                fields = {}
                for field in ('name', 'email', 'subject', 'content'):
                    value = data.get(field, '')
                    if not isinstance(value, str) or not value.strip() or len(value) > (10000 if field == 'content' else 200):
                        raise ValueError(f'A valid {field} is required.')
                    fields[field] = value.strip()
                if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', fields['email']):
                    raise ValueError('Enter a valid email address.')
                with self.server.rate_lock:
                    queue = self.server.contacts[self.client_address[0]]
                    now = time.monotonic()
                    while queue and queue[0] < now - 600:
                        queue.popleft()
                    if len(queue) >= 5:
                        return self.respond(429, {'error': 'Too many messages. Please try again later.'})
                    queue.append(now)
                with self.db() as db:
                    db.execute('INSERT INTO messages(name,email,subject,content) VALUES (?,?,?,?)', tuple(fields.values()))
                return self.respond(201, {'ok': True})
            match = re.fullmatch(r'/api/publications(?:/(\d+))?', path)
            if not match:
                return self.respond(404, {'error': 'Not found.'})
            if not self.authorized():
                return self.respond(401, {'error': 'Administrator token is required.'})
            key = match.group(1)
            if self.command == 'POST' and key is None:
                data = validate_publication(self.read_json())
                with self.db() as db:
                    cursor = db.execute('INSERT INTO publications(data) VALUES (?)', (json.dumps(data),))
                    key = cursor.lastrowid
                return self.respond(201, dict(data, id=key))
            if key and self.command in ('PUT', 'DELETE'):
                data = validate_publication(self.read_json()) if self.command == 'PUT' else None
                with self.db() as db:
                    if data is None:
                        cursor = db.execute('DELETE FROM publications WHERE id=?', (key,))
                    else:
                        cursor = db.execute('UPDATE publications SET data=? WHERE id=?', (json.dumps(data), key))
                    if cursor.rowcount == 0:
                        return self.respond(404, {'error': 'Publication not found.'})
                return self.respond(200, {'ok': True})
            return self.respond(405, {'error': 'Method not allowed.'})
        except (ValueError, TypeError, UnicodeDecodeError) as error:
            self.respond(400, {'error': str(error)})
        except sqlite3.Error:
            self.respond(503, {'error': 'Storage is unavailable. Please try again.'})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--database', type=Path, default=ROOT / '.site-data/website.sqlite3')
    args = parser.parse_args()
    initialize_database(args.database)
    token = os.environ.get('WEBSITE_ADMIN_TOKEN') or secrets.token_urlsafe(32)
    server = WebsiteServer(('127.0.0.1', args.port), args.database, token)
    print(f'Website: http://127.0.0.1:{args.port}\nEditor: http://127.0.0.1:{args.port}/admin.html', flush=True)
    if not os.environ.get('WEBSITE_ADMIN_TOKEN'):
        print(f'Administrator token (this session): {token}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
