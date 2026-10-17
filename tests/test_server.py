import json
import os
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import WebsiteServer, initialize_database


class WebsiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.database = Path(cls.temp.name) / 'test.sqlite3'
        initialize_database(cls.database)
        cls.server = WebsiteServer(('127.0.0.1', 0), cls.database, 'test-editor-token')
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join()
        cls.temp.cleanup()

    def request(self, path, method='GET', data=None, auth=False, origin=None):
        headers = {'Content-Type':'application/json'}
        if auth: headers['Authorization'] = 'Bearer test-editor-token'
        if origin: headers['Origin'] = origin
        req = Request(self.base + path, data=json.dumps(data).encode() if data is not None else None, method=method, headers=headers)
        try:
            with urlopen(req) as response:
                body = response.read()
                return response.status, json.loads(body) if response.headers.get_content_type() == 'application/json' else body
        except HTTPError as error:
            return error.code, json.loads(error.read())

    def test_publication_lifecycle_and_persistence(self):
        status, records = self.request('/api/publications')
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(records), 240)
        self.assertEqual([r['year'] for r in records], sorted([r['year'] for r in records], reverse=True))
        record = dict(records[0], title='Integration test record', year=2027, topics=['wireless'], prestigious=True, sci=True, impact_factor='4.2')
        self.assertEqual(self.request('/api/publications', 'POST', record)[0], 401)
        status, created = self.request('/api/publications', 'POST', record, auth=True)
        self.assertEqual(status, 201)
        key = created['id']
        self.assertEqual(self.request('/api/publications')[1][0]['id'], key)
        record['title'] = 'Updated integration test record'
        self.assertEqual(self.request('/api/publications/'+str(key), 'PUT', record, auth=True)[0], 200)
        initialize_database(self.database)
        self.assertEqual(self.request('/api/publications')[1][0]['title'], record['title'])
        self.assertEqual(self.request('/api/publications/'+str(key), 'DELETE', auth=True)[0], 200)
        self.assertEqual(len(self.request('/api/publications')[1]), len(records))
        self.assertEqual(self.request('/api/publications/'+str(key), 'DELETE', auth=True)[0], 404)

    def test_validation(self):
        record = self.request('/api/publications')[1][0]
        for bad in [dict(record,year='2026'), dict(record,title=''), dict(record,url='javascript:alert(1)'), dict(record,topics=['invalid']), dict(record,impact_factor='NaN'), dict(record,sci='yes')]:
            self.assertEqual(self.request('/api/publications','POST',bad,auth=True)[0],400)

    def test_contact_saved_and_private(self):
        message = dict(name='Test sender',email='sender@example.org',subject='Test inquiry',content='Persist this message.')
        self.assertEqual(self.request('/api/contact','POST',dict(message,email='bad'))[0],400)
        self.assertEqual(self.request('/api/contact','POST',message)[0],201)
        self.assertEqual(self.request('/api/messages')[0],401)
        messages=self.request('/api/messages',auth=True)[1]
        self.assertEqual(messages[0]['content'],message['content'])

    def test_private_paths_and_cross_origin(self):
        for path in ['/server.py','/.site-data/website.sqlite3','/.review/transcript-bn.json','/Instructions/Webpage%20Comments.mp4','/data/publications.json','/../server.py','/assets/../server.py']:
            self.assertEqual(self.request(path)[0],404,path)
        self.assertEqual(self.request('/api/contact','POST',{},origin='https://example.org')[0],403)
        for page in ['index','research','publications','teaching','projects','services','join-lab','contact','admin']:
            self.assertEqual(self.request('/'+page+'.html')[0],200)


if __name__ == '__main__': unittest.main()
