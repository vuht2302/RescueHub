# RescueHub Backend (.NET 8)

## 1) Run all routes in modular monolith

```bash
dotnet restore RescueHub.sln
dotnet build RescueHub.sln
dotnet run --project src/RescueHub.Api/RescueHub.Api.csproj
```

API host will load controllers from all module assemblies:

- Auth: `/api/v1/auth/*`
- Public: `/api/v1/public/*`
- Master Data: `/api/v1/master-data/*`
- Incidents: `/api/v1/incidents/*`
- Media: `/api/v1/media/*`
- AI: `/api/v1/ai/*`
- Realtime hub: `/realtime-hub`

Quick DB connectivity check route:

- `GET /api/v1/system/db-check`

## 2) Connect to real PostgreSQL

Set connection string in `src/RescueHub.Api/appsettings.json`:

```json
{
	"PostgreSql": {
		"ConnectionString": "Host=localhost;Port=5432;Database=rescuehub;Username=postgres;Password=postgres"
	}
}
```

The API host uses this connection string to register `RescueHubDbContext`.

## 3) Scaffold from existing PostgreSQL schema (Database First)

Install EF CLI once:

```bash
dotnet tool install --global dotnet-ef
```

Scaffold from real DB:

```bash
dotnet ef dbcontext scaffold "Host=localhost;Port=5432;Database=floodRescue;Username=phihung;Password=123456" Npgsql.EntityFrameworkCore.PostgreSQL \
	--project src/RescueHub.Persistence/RescueHub.Persistence.csproj \
	--startup-project src/RescueHub.Api/RescueHub.Api.csproj \
	--context RescueHubDbContext \
	--context-dir . \
	--output-dir Entities/Scaffolded \
	--use-database-names \
	--no-onconfiguring \
	--force
```

Notes:

- `--use-database-names` keeps Vietnamese/snake_case names from PostgreSQL.
- Existing handcrafted entities can coexist with scaffolded entities in `Entities/Scaffolded`.
- After scaffold, you can move each aggregate into the right module project if needed.