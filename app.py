#!/usr/bin/env python3
"""
Servidor alternativo en Python para correr el Piloto de Mapeo Territorial UTT.
No requiere dependencias externas (usa la librería estándar de Python 3).
Permite levantar el proyecto localmente con:
    python app.py
"""

import http.server
import socketserver
import json
import os
import urllib.request
import urllib.parse
from datetime import datetime

PORT = int(os.environ.get("PORT", 3000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "dist")
DATA_DIR = os.path.join(BASE_DIR, "data")
NODOS_FILE = os.path.join(DATA_DIR, "nodos.json")
REPORTE_FILE = os.path.join(DATA_DIR, "geocoding_report.json")

def cargar_nodos():
    if os.path.exists(NODOS_FILE):
        with open(NODOS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def guardar_nodos(nodos):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(NODOS_FILE, "w", encoding="utf-8") as f:
        json.dump(nodos, f, indent=2, ensure_ascii=False)

def geocodificar_nominatim(direccion, localidad, provincia="Buenos Aires"):
    query = f"{direccion}, {localidad}, {provincia}, Argentina"
    url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(query)}&limit=1&countrycodes=ar"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "UTTMapeoTerritorialPilotoPython/1.0 (contacto@trabajadoresdelatierra.org.ar)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as response:
            data = json.loads(response.read().decode("utf-8"))
            if data and len(data) > 0:
                return float(data[0]["lat"]), float(data[0]["lon"]), "nominatim"
    except Exception as e:
        print(f"[Nominatim Error]: {e}")
    
    # Coordenadas de referencia CABA si falla
    return -34.615, -58.44, "referencia"

class UTTRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR if os.path.exists(DIST_DIR) else BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/api/nodos":
            nodos = cargar_nodos()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(nodos).encode("utf-8"))
            return

        if self.path == "/api/reporte":
            reporte = {
                "total_procesados": len(cargar_nodos()),
                "geocodificados_ok": len(cargar_nodos()),
                "sin_coordenadas": 0,
                "nodos_sin_coordenadas": [],
                "fecha": datetime.now().isoformat()
            }
            if os.path.exists(REPORTE_FILE):
                with open(REPORTE_FILE, "r", encoding="utf-8") as f:
                    reporte = json.load(f)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(reporte).encode("utf-8"))
            return

        # Para Single Page Application: si no es archivo existente, servir index.html
        requested_path = os.path.join(DIST_DIR, self.path.lstrip("/"))
        if not os.path.exists(requested_path) and not self.path.startswith("/api"):
            self.path = "/index.html"

        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/nodos":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            datos = json.loads(post_data.decode("utf-8"))

            nombre = datos.get("nombre", "").strip()
            direccion = datos.get("direccion", "").strip()
            localidad = datos.get("localidad", "").strip()
            region = datos.get("region", "CABA")
            dias_entrega = datos.get("dias_entrega", "Sábados")
            telefono = datos.get("telefono", "").strip()
            mostrar_direccion_publica = datos.get("mostrar_direccion_publica", False)

            lat, lng, metodo = geocodificar_nominatim(direccion, localidad, region)

            # Formateo WhatsApp
            digits = "".join([c for c in telefono if c.isdigit()])
            whatsapp_url = f"https://wa.me/549{digits}" if len(digits) >= 10 else None

            nuevo_nodo = {
                "id": f"nodo-py-{int(datetime.now().timestamp())}",
                "nombre": nombre,
                "direccion": direccion,
                "localidad": localidad,
                "region": region,
                "telefono": telefono,
                "whatsapp_url": whatsapp_url,
                "dias_entrega": dias_entrega,
                "latitud": lat,
                "longitud": lng,
                "estado": "activo",
                "mostrar_direccion_publica": mostrar_direccion_publica,
                "geocodificado_ok": True,
                "fecha_actualizacion": datetime.now().isoformat()
            }

            nodos = cargar_nodos()
            nodos.insert(0, nuevo_nodo)
            guardar_nodos(nodos)

            self.send_response(201)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"mensaje": "¡Nodo creado con éxito!", "nodo": nuevo_nodo}).encode("utf-8"))
            return

        self.send_error(404, "Ruta no encontrada")

if __name__ == "__main__":
    print("==================================================")
    print("  Mapeo Territorial UTT - Servidor Local Python   ")
    print(f"  Disponible en: http://localhost:{PORT}         ")
    print("==================================================")
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), UTTRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
