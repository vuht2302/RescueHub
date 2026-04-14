using System.Text.Json;
using RescueHub.BuildingBlocks.Application;
using RescueHub.Modules.AI;
using RescueHub.Modules.Auth;
using RescueHub.Modules.Incidents;
using RescueHub.Modules.Incidents.Realtime;
using RescueHub.Modules.MasterData;
using RescueHub.Modules.Media;
using RescueHub.Modules.Public;
using RescueHub.Persistence;

var builder = WebApplication.CreateBuilder(args);
var swaggerEnabled = builder.Configuration.GetValue("Swagger:Enabled", true);

builder.Services
    .AddControllers()
    .AddApplicationPart(typeof(RescueHub.Modules.Auth.Api.AuthController).Assembly)
    .AddApplicationPart(typeof(RescueHub.Modules.Public.Api.PublicController).Assembly)
    .AddApplicationPart(typeof(RescueHub.Modules.MasterData.Api.MasterDataController).Assembly)
    .AddApplicationPart(typeof(RescueHub.Modules.Incidents.Api.IncidentsController).Assembly)
    .AddApplicationPart(typeof(RescueHub.Modules.Media.Api.MediaController).Assembly)
    .AddApplicationPart(typeof(RescueHub.Modules.AI.Api.AiController).Assembly)
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableUtcDateTimeJsonConverter());
    });

builder.Services.AddEndpointsApiExplorer();
if (swaggerEnabled)
{
    builder.Services.AddSwaggerGen();
}
builder.Services.AddSignalR();
builder.Services.AddPersistence(builder.Configuration);

builder.Services.AddAuthModule();
builder.Services.AddPublicModule();
builder.Services.AddMasterDataModule();
builder.Services.AddIncidentsModule();
builder.Services.AddMediaModule(builder.Configuration);
builder.Services.AddAiModule();

var app = builder.Build();

if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "RescueHub API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RescueRealtimeHub>("/realtime-hub");

app.Run();
