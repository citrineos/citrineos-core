#!/bin/bash

## This script builds the dockerize version of Postgresql in your
## local environment. Modify the config files if it's necessary
##
## Usage:
## ./build-postgresql.sh
# set -ex

## Container registry
REGISTRY_NAME="citrineos"
APP_NAME="postgis-custom"
APP_TAG="1.1.0"

## Get the OS
OS_TYPE=$(uname)

## Build docker image on Darwin (MacOS)
containerize_on_darwin() {
    echo "Building ${APP_NAME} image in ${REGISTRY_NAME}/${APP_NAME}:${APP_TAG}"

    docker build --rm --no-cache \
        -t ${REGISTRY_NAME}/${APP_NAME}:${APP_TAG} \
        -f ./postgis/Dockerfile ./postgis || exit 1

    # Delete none images generated in the build process
    delete_none_images

    echo "Docker image building has completed successfully in ${REGISTRY_NAME}/${APP_NAME}:${APP_TAG}"
}

## Build docker image on Ubuntu Linux
containerize_on_linux() {
    echo "Building ${APP_NAME} image in ${REGISTRY_NAME}/${APP_NAME}:${APP_TAG}"

    docker build --rm --no-cache --progress=plain \
        -t ${REGISTRY_NAME}/${APP_NAME}:${APP_TAG} \
        -f ./postgis/Dockerfile ./postgis || exit 1

    # Delete none images generated in the build process
    delete_none_images

    echo "Docker image building has completed successfully in ${REGISTRY_NAME}/${APP_NAME}:${APP_TAG}"
}

# Delete none images on container repository
delete_none_images() {
    docker images --filter "dangling=true" -q | xargs -r docker rmi
}

# Verify if the Docker engine is installed on the system
verify_docker_engine() {
    # Verify if service is installed
    if ! command -v docker &> /dev/null; then
        echo "Docker Engine is not installed in your system. Please install the service..."
        echo "Exiting..."
        exit 1
    fi

    # Verify if service is running
    if ! docker info &> /dev/null; then
        echo "Docker engine is installed, but not started. Please launch the service..."
        echo "Exiting..."
        exit 1
    fi
}

## Main function
main() {
    echo "${OS_TYPE} detected. Starting the installation..."
    # Verify the OS
    case "${OS_TYPE}" in
        "Darwin")
            verify_docker_engine
            containerize_on_darwin
            ;;
        "Linux")
            verify_docker_engine
            containerize_on_linux
            ;;
        *)
            echo "System isn't supported by this script: ${OS_TYPE}"
            echo "Please contact to the support team."
            exit 1
            ;;
    esac
}

main