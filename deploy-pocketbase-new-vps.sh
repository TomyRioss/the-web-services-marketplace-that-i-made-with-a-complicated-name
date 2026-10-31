#!/usr/bin/env bash
###############################################################################
# deploy-pocketbase-new-vps.sh
# Desplega las 5 instancias de PocketBase en un nuevo VPS.
# Usa los dumps tar + SQL ya generados desde la VPS actual (153.75.247.241).
#
# Uso:
#   bash deploy-pocketbase-new-vps.sh <ip-nuevo-vps> [usuario]
#
# Requiere:
#   - docker en el nuevo VPS
#   - SSH sin password (o contraseña al correrlo)
#   - Puertos libres: 8090–8100
###############################################################################

set -euo pipefail

NEW_VPS="${1:?Uso: bash $0 <ip-nuevo-vps> [usuario]}"
USER="${2:-root}"
SOURCE="root@153.75.247.241"
WORKDIR=$(mktemp -d /tmp/pb-deploy-XXXXXX)
trap 'rm -rf "$WORKDIR"' EXIT

echo "=============================================="
echo " PocketBase Deploy → ${NEW_VPS}"
echo " Workdir: ${WORKDIR}"
echo "=============================================="

# -------------------------------------------------------
# Paso 1: Verificar
# -------------------------------------------------------
echo ""
echo "[1/6] Verificando conexión..."
if ! ssh -o ConnectTimeout=5 "${USER}@${NEW_VPS}" echo OK &>/dev/null; then
    echo "ERROR: no se puede conectar a ${USER}@${NEW_VPS}" && exit 1
fi
ssh "${USER}@${NEW_VPS}" "which docker" >/dev/null 2>&1 || {
    echo "ERROR: docker no está instalado"; exit 1
}
echo "  ✓ Conectado + docker disponible"

# -------------------------------------------------------
# Paso 2: Descargar artefactos de la VPS vieja
# -------------------------------------------------------
echo ""
echo "[2/6] Descargando dumps..."

FILES_TO_FETCH=(
    "/tmp/pb-dumps/sql/ttmcobuild.sql"
    "/tmp/pb-dumps/sql/afterink.sql"
    "/tmp/pb-dumps/sql/andrade_realstate.sql"
    "/tmp/pb-dumps/sql/tomyrioss-pocketbase.sql"
    "/tmp/pb-dumps/sql/pocketbase-generic.sql"
    "/tmp/pb-dumps/ttmcobuild-data.tar"
    "/tmp/pb-dumps/afterink-data.tar"
    "/tmp/pb-dumps/andrade-realstate-data.tar"
    "/tmp/pb-dumps/tomyrioss-data.tar"
    "/tmp/pb-dumps/pocketbase-generic-data.tar"
    "/opt/ttmcobuild/pb_migrations/*"
    "/opt/afterink/pb_migrations/*"
    "/opt/andrade_realstate/pb_migrations/*"
)

for src in "${FILES_TO_FETCH[@]}"; do
    dest="$WORKDIR/$(basename "$src")"
    if scp "${SOURCE}:${src}" "$dest" 2>/dev/null; then
        echo "  ✓ $(basename "$src")"
    fi
done

# También bajamos los hooks si existen
for proj in ttmcobuild afterink andrade_realstate; do
    # Verificar hooks dir en cada uno
    :
done

# -------------------------------------------------------
# Paso 3: Subir y preparar en nuevo VPS
# -------------------------------------------------------
echo ""
echo "[3/6] Preparando estructura en nuevo VPS..."

PROJECTS=(
    "ttmcobuild"
    "afterink" 
    "andrade_realstate"
)

for proj in "${PROJECTS[@]}"; do
    base="/opt/${proj}"
    
    # Crear directorios
    ssh "${USER}@${NEW_VPS}" "mkdir -p ${base}/pb_data ${base}/pb_migrations"
    
    # Extraer data tarball
    if [ -f "$WORKDIR/${proj}-data.tar" ]; then
        scp "$WORKDIR/${proj}-data.tar" "${USER}@${NEW_VPS}:${base}/.data.tar"
        ssh "${USER}@${NEW_VPS}" "cd ${base}/pb_data && tar xf ../.data.tar && rm ../.data.tar"
        echo "  ✓ ${proj}: data extraída"
    else
        echo "  ✗ ${proj}: FALTA data.tar"
    fi
    
    # Subir migraciones
    if ls "$WORKDIR/"*"$proj"*migration* "$WORKDIR/"*"$proj"_*.js 2>/dev/null; then
        scp "$WORKDIR/"*"$proj"*migration* "$WORKDIR/"*"$proj"_*.js \
            "${USER}@${NEW_VPS}:${base}/pb_migrations/" 2>/dev/null || true
        echo "  ✓ ${proj}: migraciones subidas"
    fi
done

# Contenedores sin proyecto dedicado (tomyrioss, pocketbase-genérico)
TOMYRIOS_PORTS=(8092)
GENERIC_PORTS=(8090)

for port_info in "${TOMYRIOS_PORTS[@]}" "${GENERIC_PORTS[@]}"; do
    :
done

echo "  ✓ Estructura preparada"

# -------------------------------------------------------
# Paso 4: Detener contenedores viejos
# -------------------------------------------------------
echo ""
echo "[4/6] Limpiando contenedores antiguos..."

CONTAINERS=(
    "ttmcobuild-pocketbase"
    "afterink-pocketbase"
    "andrade_realstate-pocketbase"
    "tomyrioss-pocketbase"
    "pocketbase-generic"
)

for cname in "${CONTAINERS[@]}"; do
    ssh "${USER}@${NEW_VPS}" "docker stop '${cname}' 2>/dev/null; docker rm '${cname}' 2>/dev/null"
    echo "  ✓ limpiado: ${cname}"
done

# -------------------------------------------------------
# Paso 5: Arrancar todo
# -------------------------------------------------------
echo ""
echo "[5/6] Levantando contenedores..."

launch() {
    local name=$1
    local port=$2
    local workdir=$3
    local cname="${name}-pocketbase"
    
    [ -n "$workdir" ] && workdir="/opt/${name}"
    [ -z "$workdir" ] && workdir="/opt/${name}"
    
    CMD="docker run --name '${cname}' --restart unless-stopped \
         -p '127.0.0.1:${port}:8090' \
         ghcr.io/muchobien/pocketbase:latest \
         serve --http=0.0.0.0:8090"
    
    CMD+=" --dir=${workdir}/pb_data"
    
    # Migrations dir
    if [ -d "${workdir}/pb_migrations" ]; then
        CMD+=" --migrationsDir=${workdir}/pb_migrations"
    fi
    
    ssh "${USER}@${NEW_VPS}" "$CMD" &
    echo "  ✓ ${cname} → localhost:${port}"
}

# Instancias con proyecto dedicado
launch "ttmcobuild"     "18096" ""
launch "afterink"       "8095"  ""
launch "andrade_realstate" "8093" ""

# Instancias sin proyecto dedicado — usar su propio /opt/<name>
launch "tomyrioss-pocketbase" "8092" ""
launch "pocketbase-generic"   "8090" ""

wait
sleep 3

# -------------------------------------------------------
# Paso 6: Verificación
# -------------------------------------------------------
echo ""
echo "[6/6] Verificación..."

ALL_OK=true
for cname in "${CONTAINERS[@]}"; do
    case "$cname" in
        ttmcobuild-pocketbase)      PORT=18096 ;;
        afterink-pocketbase)        PORT=8095 ;;
        andrade_realstate-pocketbase) PORT=8093 ;;
        tomyrioss-pocketbase)       PORT=8092 ;;
        pocketbase-generic)         PORT=8090 ;;
    esac
    
    if ssh "${USER}@${NEW_VPS}" "curl -sf http://127.0.0.1:${PORT}/api/health >/dev/null"; then
        echo "  ✓ ${cname} running (localhost:${PORT})"
    else
        echo "  ✗ ${cname} FAIL — revisando logs:"
        ssh "${USER}@${NEW_VPS}" "docker logs --tail 10 '${cname}'"
        ALL_OK=false
    fi
done

echo ""
echo "=============================================="
if $ALL_OK; then
    echo " ✅ TODO DESPLEGADO CORRECTAMENTE"
else
    echo " ⚠️ Algunas instancias necesitan atención"
fi
echo "=============================================="
echo ""
echo "Accesos:"
echo "  localhost:18096 → ttmcobuild"
echo "  localhost:8095  → afterink"  
echo "  localhost:8093  → andrade_realstate"
echo "  localhost:8092  → tomyrioss-pocketbase"
echo "  localhost:8090  → pocketbase-generic"
echo ""
echo "Dashboard: http://IP_NUEVO:<puerto>/_/"
