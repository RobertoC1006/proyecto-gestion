"""Servicio analítico interno. Nunca recibe identidades ni descripciones."""
import json
import os
import re
import threading
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from engine import run

LOCK = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, payload):
        body = json.dumps(payload, allow_nan=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            payload, status = {'status': 'ok', 'service': 'campusitsm-predictions', 'engine': 'demand-v1'}, 200
        else:
            payload, status = {'code': 'NOT_IMPLEMENTED'}, 404
        self.reply(status, payload)

    def do_POST(self):
        if self.path != '/v1/run': return self.reply(404, {'code': 'NOT_FOUND'})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 2 * 1024 * 1024: return self.reply(413, {'code': 'PAYLOAD_LIMIT'})
            data = json.loads(self.rfile.read(size))
            if not re.fullmatch(r'[a-f0-9-]{36}', data.get('runId', '')): raise ValueError('runId')
            if not LOCK.acquire(blocking=False): return self.reply(503, {'code': 'BUSY'})
            try: result = run(data, Path(os.environ.get('MODELS_DIR', '/models')))
            finally: LOCK.release()
            self.reply(200, result)
        except (ValueError, TypeError, KeyError): self.reply(400, {'code': 'INVALID_ANALYTICS_INPUT'})
        except Exception: self.reply(503, {'code': 'MODEL_FAILED'})

    def log_message(self, format, *args):
        # No almacenar URL arbitraria ni contenido privado en logs.
        pass


if __name__ == '__main__':
    os.makedirs(os.environ.get('MODELS_DIR', '/models'), exist_ok=True)
    ThreadingHTTPServer(('0.0.0.0', 8000), Handler).serve_forever()
