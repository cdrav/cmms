#!/bin/bash

# Script de despliegue para CMMS Hospitalario
# Este script facilita el despliegue en producción usando Docker

set -e

echo "🚀 Iniciando despliegue de CMMS Hospitalario..."

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Creando desde .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Archivo .env creado. Por favor edita los valores necesarios."
    else
        echo "❌ Archivo .env.example no encontrado. Por favor crea un archivo .env manualmente."
        exit 1
    fi
fi

# Verificar SESSION_SECRET
if grep -q "SESSION_SECRET=" .env && grep -q "your-secret-key-here" .env; then
    echo "⚠️  SESSION_SECRET no ha sido configurado. Generando uno aleatorio..."
    SECRET=$(openssl rand -base64 32)
    sed -i "s/SESSION_SECRET=your-secret-key-here/SESSION_SECRET=$SECRET/" .env
    echo "✅ SESSION_SECRET generado y configurado."
fi

# Crear directorio de storage si no existe
mkdir -p storage/uploads

# Construir y levantar los contenedores
echo "🔨 Construyendo imagen Docker..."
docker-compose build

echo "🚀 Levantando contenedores..."
docker-compose up -d

echo "✅ Despliegue completado exitosamente!"
echo "🌐 La aplicación está disponible en http://localhost:3000"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Detener: docker-compose down"
echo "  - Reiniciar: docker-compose restart"
echo "  - Ver estado: docker-compose ps"
