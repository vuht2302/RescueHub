FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY RescueHub.sln ./
COPY src/RescueHub.Api/RescueHub.Api.csproj src/RescueHub.Api/
COPY src/RescueHub.BuildingBlocks/RescueHub.BuildingBlocks.csproj src/RescueHub.BuildingBlocks/
COPY src/RescueHub.Modules.Auth/RescueHub.Modules.Auth.csproj src/RescueHub.Modules.Auth/
COPY src/RescueHub.Modules.Public/RescueHub.Modules.Public.csproj src/RescueHub.Modules.Public/
COPY src/RescueHub.Modules.MasterData/RescueHub.Modules.MasterData.csproj src/RescueHub.Modules.MasterData/
COPY src/RescueHub.Modules.Incidents/RescueHub.Modules.Incidents.csproj src/RescueHub.Modules.Incidents/
COPY src/RescueHub.Modules.Media/RescueHub.Modules.Media.csproj src/RescueHub.Modules.Media/
COPY src/RescueHub.Modules.AI/RescueHub.Modules.AI.csproj src/RescueHub.Modules.AI/
COPY src/RescueHub.Persistence/RescueHub.Persistence.csproj src/RescueHub.Persistence/

RUN dotnet restore RescueHub.sln

COPY . .
RUN dotnet publish src/RescueHub.Api/RescueHub.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .
COPY src/RescueHub.Api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 10000

ENTRYPOINT ["/entrypoint.sh"]
