#!/bin/sh
set -e

PORT_TO_USE="${PORT:-10000}"
exec dotnet RescueHub.Api.dll --urls "http://0.0.0.0:${PORT_TO_USE}"
