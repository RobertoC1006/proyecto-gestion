"""Servicio interno de infraestructura; todavía no genera pronósticos."""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            payload, status = {'status': 'ok', 'service': 'campusitsm-predictions', 'model': 'not_implemented'}, 200
        else:
            payload, status = {'code': 'NOT_IMPLEMENTED'}, 404
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        # No almacenar URL arbitraria ni contenido privado en logs.
        pass


if __name__ == '__main__':
    os.makedirs(os.environ.get('MODELS_DIR', '/models'), exist_ok=True)
    ThreadingHTTPServer(('0.0.0.0', 8000), Handler).serve_forever()
