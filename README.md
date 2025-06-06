# Portal de Gestión de Incidentes - InfraTech S.A.

Este documento describe la estructura y organización del directorio para el frontend de la aplicación de gestión de incidentes.  
El frontend está desarrollado utilizando el framework Angular. 

## Tabla de Contenidos
- Prerrequisitos
- Ejecución Local
- Ejecución con Docker

## Prerrequisitos
Asegúrate de tener instalado el siguiente software en tu máquina local:
- Node.js (versión 18.x o superior recomendada)
- Angular CLI
- Docker (para ejecución en contenedores)

## Ejecución Local
Sigue estos pasos para ejecutar la aplicación en tu entorno de desarrollo local:

1. Clonar el repositorio:
    ```bash
    git clone https://github.com/pvblitooo/Solemne2-Infratech.git
    cd Solemne2-Infratech/frontend
    ```

2. Instalar dependencias:
    ```bash
    npm install
    ```

3. Iniciar el servidor de desarrollo:
    ```bash
    ng serve
    ```
    Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias alguno de los archivos fuente. 

## Ejecución con Docker
Para construir y ejecutar la aplicación utilizando Docker, sigue estos pasos: 

1. Construir la imagen de Docker: 
    ```bash
    docker build -t infratech-frontend .
    ```

2. Ejecutar el contenedor: 
    ```bash
    docker run -p 8080:80 infratech-frontend
    ```
    La aplicación estará disponible en `http://localhost:8080`.
