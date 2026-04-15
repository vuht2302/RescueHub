using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RescueHub.BuildingBlocks.Application;
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
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableUtcDateTimeJsonConverter());
    });

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Missing Jwt:Key configuration.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Missing Jwt:Issuer configuration.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Missing Jwt:Audience configuration.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();

var appsettingsConfiguration = new ConfigurationBuilder()
    .SetBasePath(builder.Environment.ContentRootPath)
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: false)
    .Build();

var redisConnectionString = appsettingsConfiguration["Redis:ConnectionString"];
if (string.IsNullOrWhiteSpace(redisConnectionString))
{
    redisConnectionString = builder.Configuration["Redis:ConnectionString"];
}

if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
        options.InstanceName = "rescuehub:";
    });
}
else
{
    // Fallback for local/dev if Redis is not configured.
    builder.Services.AddDistributedMemoryCache();
}

if (swaggerEnabled)
{
    builder.Services.AddSwaggerGen(options =>
    {
        var xmlFiles = new[]
        {
            "RescueHub.Api.xml",
            "RescueHub.Modules.Auth.xml",
            "RescueHub.Modules.Public.xml",
            "RescueHub.Modules.MasterData.xml",
            "RescueHub.Modules.Incidents.xml",
            "RescueHub.Modules.Media.xml"
        };

        foreach (var xmlFile in xmlFiles)
        {
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
            }
        }

        options.MapType<IFormFile>(() => new OpenApiSchema
        {
            Type = "string",
            Format = "binary"
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Nhap token theo dang: Bearer {your JWT token}"
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });
}
builder.Services.AddSignalR();
builder.Services.AddPersistence(builder.Configuration);

builder.Services.AddAuthModule();
builder.Services.AddPublicModule();
builder.Services.AddMasterDataModule();
builder.Services.AddIncidentsModule();
builder.Services.AddMediaModule(builder.Configuration);

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
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RescueRealtimeHub>("/realtime-hub");

app.Run();
