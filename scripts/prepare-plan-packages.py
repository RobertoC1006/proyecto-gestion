"""Genera los tres paquetes de contexto desde los documentos vigentes del repositorio."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PEOPLE = ('ROBERTO', 'JOHAN', 'JASMINE')
FINAL_MOCKUPS = (
    '01_cu01_ingreso_reporte_v2.png',
    '02_cu01_seguimiento_atencion_v2.png',
    '03_cu02_constancias.png',
    '04_cu03_predicciones_alertas.png',
    '05_cu03_calendario_configuracion.png',
    '06_cu03_permisos_privacidad_auditoria_v2.png',
)


def package_sources():
    paths = {ROOT / name for name in ('AGENTS.md', 'README.md', 'MEMORIA_PROYECTO.md', 'PROYECTO.md')}
    paths.update((ROOT / 'planes').glob('PLAN_*.md'))
    paths.update((ROOT / 'docs').glob('*.md'))
    paths.update(ROOT / 'docs/entregas' / name for name in (
        'roberto-semana-01-base.md',
        'roberto-semana-01-calendario.md',
        'roberto-calendario-diseno-casos-gestion.md',
    ))
    paths.add(ROOT / 'docs/api/openapi.json')
    paths.add(ROOT / 'diseno/campusitsm/CASOS_DE_USO_Y_PANTALLAS.md')
    paths.update(ROOT / 'diseno/campusitsm' / name for name in FINAL_MOCKUPS)
    # Cierra los enlaces locales de documentación/imagenes sin incluir código,
    # credenciales, datos de negocio ni dependencias instaladas.
    pending = list(paths)
    while pending:
        source = pending.pop()
        if source.suffix != '.md':
            continue
        for match in re.finditer(r'!?\[[^\]]*\]\(([^)]+)\)', source.read_text(encoding='utf-8')):
            target = match.group(1).strip().strip('<>')
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            path = (source.parent / unquote(parsed.path)).resolve()
            if not path.is_relative_to(ROOT) or not path.is_file():
                raise ValueError(f'Enlace local inexistente o externo: {source.relative_to(ROOT)} -> {target}')
            if path.suffix.lower() not in ('.md', '.png', '.json'):
                raise ValueError(f'Revisar tipo de referencia antes de empaquetar: {path.relative_to(ROOT)}')
            if path not in paths:
                paths.add(path)
                pending.append(path)
    return {path.relative_to(ROOT).as_posix(): path.read_bytes() for path in sorted(paths)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'outputs/planes_para_compartir')
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    sources = package_sources()
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    for person in PEOPLE:
        entries = dict(sources)
        entries['LEEME.md'] = f'''# Paquete de {person.title()} — CampusITSM

Comienza por AGENTS.md, planes/PLAN_{person}.md, docs/COORDINACION_SUPABASE.md y
docs/ESTADO_EQUIPO.md. Consulta docs/REGISTRO_CAMBIOS_BD.md antes de cambiar esquema.
Se incluyen los tres planes y las seis láminas para conservar el contexto compartido;
trabaja solo el módulo y la semana de tu plan que se soliciten.

Este ZIP contiene documentación y referencias, no una copia ejecutable del proyecto.
Obtén el código base autorizado por Roberto de
https://github.com/RobertoC1006/proyecto-gestion y verifica rama/commit reales.
Main revisado al actualizar los planes: 02d10f5; identidad implementada en la rama
identidad-supabase, 8b02d6f, todavía sin integrar/publicar en main en esa revisión.

No recrear Docker ni el diseño compartido. Roberto asume P01/Supabase Auth y
autorización común; Jasmine administra usuarios/permisos sobre esa base y conserva
consentimiento/auditoría; Johan desarrolla incidencias. Identidad tiene un avance en
su rama propia: revisar docs/ESTADO_EQUIPO.md y la entrega antes de consumirlo como main.
Las capturas con fixture son ejemplos de prueba, no datos reales ni un login listo.

ACUERDO NUEVO: los tres backend usarán una misma base de desarrollo en Supabase,
con frontend/backend/Python en el Docker de cada uno. Traslado, conexiones y
colaboradores todavía pendientes: este ZIP no los ejecuta ni acredita habilitación.
El Compose actual sigue siendo local y ejecuta migraciones al arrancar; no apuntarlo
unilateralmente a Supabase. PostgreSQL local queda para pruebas aisladas.

Una rama Git no aísla la base común. Cada integrante escribe sus migraciones y
coordina cambios concretos con Roberto. Un cambio común validado/autorizado puede
aplicarse antes de fusionar el módulo completo; registrar archivo/commit, ejecutor
y verificación y compartir la dependencia. No duplicar tablas/login ni hacer pruebas
destructivas en la base común. Configuración privada fuera de Git/ZIP/mensajes.

MANIFIESTO.json identifica el contenido por SHA-256. El generador toma los archivos
del directorio de trabajo; el commit de origen por sí solo no acredita que todos
los documentos de este paquete ya estuvieran confirmados en ese commit.
'''.encode('utf-8')
        manifest = {
            'responsable': person.title(),
            'fecha_revision_planes': '2026-11-07',
            'commit_checkout_al_generar': head,
            'origen_archivos': 'directorio_de_trabajo_verificado_por_sha256',
            'base_docker_main': '196a2144aae253ca672eeeaf721c62204516245a',
            'base_visual': '047d1a2e0fd4f71bb189ff301cacb6e1f21019cf',
            'integracion': 'https://github.com/RobertoC1006/proyecto-gestion/pull/2',
            'guia_coordinacion': 'docs/COORDINACION_SUPABASE.md',
            'registro_cambios_bd': 'docs/REGISTRO_CAMBIOS_BD.md',
            'estado_operativo': 'consultar_docs_ESTADO_EQUIPO_no_inferir_habilitacion_del_zip',
            'sha256': {name: hashlib.sha256(data).hexdigest() for name, data in sorted(entries.items())},
        }
        entries['MANIFIESTO.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
        destination = output / f'PAQUETE_{person}.zip'
        with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for name, data in sorted(entries.items()):
                archive.writestr(name, data)
        with zipfile.ZipFile(destination) as archive:
            if archive.testzip() is not None:
                raise ValueError(f'Paquete dañado: {destination.name}')
            for name, data in entries.items():
                if archive.read(name) != data:
                    raise ValueError(f'Contenido distinto: {destination.name}/{name}')
            for name, digest in manifest['sha256'].items():
                if hashlib.sha256(archive.read(name)).hexdigest() != digest:
                    raise ValueError(f'Hash incorrecto: {destination.name}/{name}')
        print(f'{destination.name}: {len(entries)} archivos verificados, {destination.stat().st_size} bytes')


if __name__ == '__main__':
    main()
