using System.IdentityModel.Tokens.Jwt;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Modules.Auth.Application;

public sealed class AuthService(
    RescueHubDbContext dbContext,
    IConfiguration configuration,
    IDistributedCache distributedCache,
    ILogger<AuthService> logger) : IAuthService
{
    private static readonly ConcurrentDictionary<string, LocalOtpEntry> LocalOtpStore = new();
    private readonly HttpClient _httpClient = new();

    private sealed record LocalOtpEntry(string OtpCode, DateTime ExpiredAtUtc);

    public async Task<object> Login(LoginRequest request)
    {
        var identity = request.Username.Trim();
        var normalizedPhoneIdentity = NormalizePhoneForOtp(identity);
        var user = await dbContext.app_users
            .Include(x => x.app_user_roles)
            .ThenInclude(x => x.role)
            .FirstOrDefaultAsync(x =>
                x.is_active &&
                (
                    (x.username != null && x.username == identity) ||
                    (x.phone != null && (x.phone == identity || x.phone == normalizedPhoneIdentity)) ||
                    (x.email != null && x.email == identity)
                ));

        if (user is null)
        {
            throw new InvalidOperationException("Tai khoan khong ton tai hoac da bi vo hieu hoa.");
        }

        var roles = user.app_user_roles
            .Select(x => x.role.code)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (string.IsNullOrWhiteSpace(user.password_hash) || !VerifyPassword(request.Password, user.password_hash))
        {
            throw new InvalidOperationException("Thong tin dang nhap khong hop le.");
        }

        user.last_login_at = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        var refreshToken = GenerateRefreshToken(user.id);

        return new
        {
            accessToken = GenerateAccessToken(user.id, user.display_name, user.phone, roles),
            refreshToken,
            expiresAt = DateTime.UtcNow.AddHours(1),
            user = new
            {
                id = user.id,
                displayName = user.display_name,
                phone = user.phone,
                roles
            }
        };
    }

    public async Task<object> Refresh(RefreshTokenRequest request)
    {
        var userId = ValidateRefreshToken(request.RefreshToken);

        var user = await dbContext.app_users
            .Include(x => x.app_user_roles)
            .ThenInclude(x => x.role)
            .FirstOrDefaultAsync(x => x.id == userId && x.is_active);

        if (user is null)
        {
            throw new InvalidOperationException("Refresh token khong hop le.");
        }

        var roles = user.app_user_roles
            .Select(x => x.role.code)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var newRefreshToken = GenerateRefreshToken(user.id);

        return new
        {
            accessToken = GenerateAccessToken(user.id, user.display_name, user.phone, roles),
            refreshToken = newRefreshToken,
            expiresAt = DateTime.UtcNow.AddHours(1)
        };
    }

    public async Task<object> RequestOtp(RequestOtpRequest request)
    {
        var normalizedPurpose = request.Purpose.Trim().ToUpperInvariant();
        var normalizedPhone = NormalizePhoneForOtp(request.Phone);
        var user = await dbContext.app_users
            .Include(x => x.app_user_roles)
            .ThenInclude(x => x.role)
            .FirstOrDefaultAsync(x => x.phone == normalizedPhone && x.is_active);

        if (normalizedPurpose == "LOGIN")
        {
            if (user is not null)
            {
                var isCitizen = user.app_user_roles.Any(x => string.Equals(x.role.code, "CITIZEN", StringComparison.OrdinalIgnoreCase));
                if (!isCitizen)
                {
                    throw new InvalidOperationException("OTP login hien chi ap dung cho citizen.");
                }
            }
        }

        var otpCode = GenerateOtp();
        var expiredAt = DateTime.UtcNow.AddMinutes(5);

        await SaveOtpAsync(normalizedPhone, normalizedPurpose, otpCode, expiredAt);

        if (IsTelegramBotEnabled())
        {
            var sent = await SendOtpViaTelegramAsync(normalizedPhone, otpCode);
            if (sent)
            {
                return new
                {
                    expiredAt,
                    channel = "TELEGRAM"
                };
            }
        }

        return new
        {
            expiredAt,
            otpCode
        };
    }

    public async Task<object> VerifyOtp(VerifyOtpRequest request)
    {
        var normalizedPurpose = request.Purpose.Trim().ToUpperInvariant();
        var normalizedPhone = NormalizePhoneForOtp(request.Phone);

        var valid = await ValidateOtpAsync(normalizedPhone, normalizedPurpose, request.OtpCode);

        if (!valid)
        {
            throw new InvalidOperationException("OTP khong hop le hoac da het han.");
        }

        if (!string.Equals(normalizedPurpose, "LOGIN", StringComparison.OrdinalIgnoreCase))
        {
            return new { verified = true };
        }

        var user = await dbContext.app_users
            .Include(x => x.app_user_roles)
            .ThenInclude(x => x.role)
            .FirstOrDefaultAsync(x => x.phone == normalizedPhone && x.is_active);

        if (user is null)
        {
            var temporaryAccessToken = GenerateTemporaryAccessToken(normalizedPhone, normalizedPurpose);

            return new
            {
                verified = true,
                accessToken = temporaryAccessToken,
                expiresAt = DateTime.UtcNow.AddMinutes(configuration.GetValue<int?>("Jwt:TemporaryAccessTokenExpiryMinutes") ?? 120),
                user = new
                {
                    id = (Guid?)null,
                    displayName = "Citizen Guest",
                    phone = normalizedPhone,
                    roles = new[] { "CITIZEN_TEMP" },
                    isTemporary = true
                }
            };
        }

        var roles = user.app_user_roles
            .Select(x => x.role.code)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (!roles.Contains("CITIZEN", StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("OTP login hien chi ap dung cho citizen.");
        }

        user.last_login_at = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        var refreshToken = GenerateRefreshToken(user.id);

        return new
        {
            verified = true,
            accessToken = GenerateAccessToken(user.id, user.display_name, user.phone, roles),
            refreshToken,
            expiresAt = DateTime.UtcNow.AddHours(1),
            user = new
            {
                id = user.id,
                displayName = user.display_name,
                phone = user.phone,
                roles
            }
        };
    }

    public async Task<object> RegisterCitizen(RegisterCitizenRequest request)
    {
        var displayName = request.DisplayName?.Trim();
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new InvalidOperationException("DisplayName la bat buoc.");
        }

        var password = request.Password?.Trim();
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException("Password la bat buoc.");
        }

        if (password.Length < 6)
        {
            throw new InvalidOperationException("Password phai co it nhat 6 ky tu.");
        }

        var normalizedPhone = NormalizePhoneForOtp(request.Phone);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
        {
            throw new InvalidOperationException("Phone la bat buoc.");
        }

        var citizenRole = await GetOrCreateCitizenRole();

        var existingUsers = await dbContext.app_users
            .Include(x => x.app_user_roles)
            .ThenInclude(x => x.role)
            .Where(x =>
                x.phone == normalizedPhone ||
                x.username == normalizedPhone ||
                (x.phone != null && x.phone.EndsWith(normalizedPhone)) ||
                (x.username != null && x.username.EndsWith(normalizedPhone)))
            .ToListAsync();

        var existingByPhone = existingUsers
            .FirstOrDefault(x =>
                string.Equals(NormalizePhoneForOtp(x.phone ?? string.Empty), normalizedPhone, StringComparison.Ordinal) ||
                string.Equals(NormalizePhoneForOtp(x.username), normalizedPhone, StringComparison.Ordinal));

        if (existingByPhone is not null)
        {
            if (!existingByPhone.is_active)
            {
                throw new InvalidOperationException("So dien thoai da ton tai nhung tai khoan dang bi vo hieu hoa.");
            }

            throw new InvalidOperationException("So dien thoai da ton tai.");
        }

        var now = DateTime.UtcNow;
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        var user = new app_user
        {
            id = Guid.NewGuid(),
            username = normalizedPhone,
            display_name = displayName,
            phone = normalizedPhone,
            email = null,
            password_hash = passwordHash,
            password_hash_algo = "BCRYPT",
            is_active = true,
            last_login_at = null,
            created_at = now,
            updated_at = now
        };

        dbContext.app_users.Add(user);
        dbContext.app_user_roles.Add(new app_user_role
        {
            user_id = user.id,
            role_id = citizenRole.id,
            assigned_at = now
        });

        await dbContext.SaveChangesAsync();

        return new
        {
            citizenId = user.id,
            displayName = user.display_name,
            phone = user.phone,
            username = user.username,
            registered = true
        };
    }

    private async Task<app_role> GetOrCreateCitizenRole()
    {
        var citizenRole = await dbContext.app_roles.FirstOrDefaultAsync(x => x.code == "CITIZEN");
        if (citizenRole is not null)
        {
            return citizenRole;
        }

        citizenRole = new app_role
        {
            id = Guid.NewGuid(),
            code = "CITIZEN",
            name = "Citizen",
            description = "Citizen account"
        };

        dbContext.app_roles.Add(citizenRole);
        return citizenRole;
    }

    private string GenerateAccessToken(Guid userId, string displayName, string? phone, IReadOnlyCollection<string> roles)
    {
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Missing Jwt:Issuer configuration.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Missing Jwt:Audience configuration.");
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Missing Jwt:Key configuration.");
        var expiryMinutes = configuration.GetValue<int?>("Jwt:AccessTokenExpiryMinutes") ?? 60;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId == Guid.Empty ? displayName : userId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, displayName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        if (!string.IsNullOrWhiteSpace(phone))
        {
            claims.Add(new Claim("phone", phone));
        }

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        if (storedHash.StartsWith("$2", StringComparison.Ordinal))
        {
            return BCrypt.Net.BCrypt.Verify(password, storedHash);
        }

        if (storedHash.StartsWith("AQAAAA", StringComparison.Ordinal) || storedHash.StartsWith("AAAA", StringComparison.Ordinal))
        {
            return VerifyAspNetIdentityV3(password, storedHash);
        }

        return false;
    }

    private static bool VerifyAspNetIdentityV3(string password, string storedHash)
    {
        byte[] decoded;
        try
        {
            decoded = Convert.FromBase64String(storedHash);
        }
        catch
        {
            return false;
        }

        // Identity V3 format: [0]=0x01, [1..4]=PRF, [5..8]=iter, [9..12]=saltLen, [salt], [subkey]
        if (decoded.Length < 13 || decoded[0] != 0x01)
        {
            return false;
        }

        var prf = ReadNetworkByteOrder(decoded, 1);
        var iterCount = (int)ReadNetworkByteOrder(decoded, 5);
        var saltLength = (int)ReadNetworkByteOrder(decoded, 9);

        if (saltLength < 16 || 13 + saltLength > decoded.Length)
        {
            return false;
        }

        var salt = new byte[saltLength];
        Buffer.BlockCopy(decoded, 13, salt, 0, salt.Length);

        var subkeyLength = decoded.Length - 13 - saltLength;
        if (subkeyLength <= 0)
        {
            return false;
        }

        var expectedSubkey = new byte[subkeyLength];
        Buffer.BlockCopy(decoded, 13 + saltLength, expectedSubkey, 0, expectedSubkey.Length);

        var hashAlgorithm = prf switch
        {
            0 => HashAlgorithmName.SHA1,
            1 => HashAlgorithmName.SHA256,
            2 => HashAlgorithmName.SHA512,
            _ => HashAlgorithmName.SHA512
        };

        var actualSubkey = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterCount, hashAlgorithm, subkeyLength);
        return CryptographicOperations.FixedTimeEquals(actualSubkey, expectedSubkey);
    }

    private static uint ReadNetworkByteOrder(byte[] buffer, int offset)
        => ((uint)buffer[offset] << 24)
         | ((uint)buffer[offset + 1] << 16)
         | ((uint)buffer[offset + 2] << 8)
         | buffer[offset + 3];

    private string GenerateRefreshToken(Guid userId)
    {
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Missing Jwt:Issuer configuration.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Missing Jwt:Audience configuration.");
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Missing Jwt:Key configuration.");
        var expiryHours = configuration.GetValue<int?>("Jwt:RefreshTokenExpiryHours") ?? 168;

        var claims = new List<Claim>
        {
            new("token_type", "refresh"),
            new(JwtRegisteredClaimNames.Sub, userId.ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateTemporaryAccessToken(string phone, string purpose)
    {
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Missing Jwt:Issuer configuration.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Missing Jwt:Audience configuration.");
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Missing Jwt:Key configuration.");
        var expiryMinutes = configuration.GetValue<int?>("Jwt:TemporaryAccessTokenExpiryMinutes") ?? 120;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, $"temp:{phone}"),
            new(JwtRegisteredClaimNames.UniqueName, "Citizen Guest"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new("phone", phone),
            new("token_type", "temporary"),
            new("otp_purpose", purpose),
            new(ClaimTypes.Role, "CITIZEN_TEMP")
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private Guid ValidateRefreshToken(string refreshToken)
    {
        var normalizedRefreshToken = (refreshToken ?? string.Empty).Trim();
        if (normalizedRefreshToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            normalizedRefreshToken = normalizedRefreshToken[7..].Trim();
        }

        if (string.IsNullOrWhiteSpace(normalizedRefreshToken))
        {
            throw new InvalidOperationException("Refresh token khong hop le.");
        }

        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Missing Jwt:Issuer configuration.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Missing Jwt:Audience configuration.");
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Missing Jwt:Key configuration.");

        var validation = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        ClaimsPrincipal principal;
        try
        {
            principal = new JwtSecurityTokenHandler().ValidateToken(normalizedRefreshToken, validation, out _);
        }
        catch
        {
            throw new InvalidOperationException("Refresh token khong hop le.");
        }

        var tokenType = principal.FindFirstValue("token_type");
        if (!string.Equals(tokenType, "refresh", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Refresh token khong hop le.");
        }

        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(sub, out var userId))
        {
            throw new InvalidOperationException("Refresh token khong hop le.");
        }

        return userId;
    }

    private static string GenerateOtp()
    {
        Span<byte> bytes = stackalloc byte[4];
        RandomNumberGenerator.Fill(bytes);
        var value = Math.Abs(BitConverter.ToInt32(bytes)) % 1_000_000;
        return value.ToString("D6");
    }

    private async Task<bool> ValidateOtpAsync(string phone, string purpose, string otpCode)
    {
        var key = BuildOtpCacheKey(phone, purpose);
        try
        {
            var cachedOtp = await distributedCache.GetStringAsync(key);
            if (string.IsNullOrWhiteSpace(cachedOtp))
            {
                return TryValidateLocalOtp(key, otpCode);
            }

            var isValid = string.Equals(cachedOtp, otpCode, StringComparison.Ordinal);
            if (isValid)
            {
                await distributedCache.RemoveAsync(key);
                LocalOtpStore.TryRemove(key, out _);
            }

            return isValid;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable when validating OTP. Falling back to local memory cache.");
            return TryValidateLocalOtp(key, otpCode);
        }
    }

    private async Task SaveOtpAsync(string phone, string purpose, string otpCode, DateTime expiredAtUtc)
    {
        var key = BuildOtpCacheKey(phone, purpose);
        var ttl = expiredAtUtc - DateTime.UtcNow;
        if (ttl <= TimeSpan.Zero)
        {
            ttl = TimeSpan.FromMinutes(5);
        }

        try
        {
            await distributedCache.SetStringAsync(
                key,
                otpCode,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = ttl
                });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable when saving OTP. Falling back to local memory cache.");
            LocalOtpStore[key] = new LocalOtpEntry(otpCode, expiredAtUtc);
        }
    }

    private static bool TryValidateLocalOtp(string key, string otpCode)
    {
        if (!LocalOtpStore.TryGetValue(key, out var entry))
        {
            return false;
        }

        if (entry.ExpiredAtUtc <= DateTime.UtcNow)
        {
            LocalOtpStore.TryRemove(key, out _);
            return false;
        }

        var isValid = string.Equals(entry.OtpCode, otpCode, StringComparison.Ordinal);
        if (isValid)
        {
            LocalOtpStore.TryRemove(key, out _);
        }

        return isValid;
    }

    private static string BuildOtpCacheKey(string phone, string purpose)
        => $"otp:{purpose.Trim().ToUpperInvariant()}:{NormalizePhoneForOtp(phone)}";

    private static string NormalizePhoneForOtp(string phone)
    {
        var input = phone?.Trim() ?? string.Empty;
        if (input.Length == 0)
        {
            return string.Empty;
        }

        if (input.StartsWith("+", StringComparison.Ordinal))
        {
            var digitsAfterPlus = Regex.Replace(input[1..], "[^0-9]", string.Empty);
            if (digitsAfterPlus.StartsWith("84", StringComparison.Ordinal))
            {
                var local = digitsAfterPlus[2..];
                if (local.Length > 0 && !local.StartsWith("0", StringComparison.Ordinal))
                {
                    return "0" + local;
                }
            }

            return "+" + digitsAfterPlus;
        }

        return Regex.Replace(input, "[^0-9]", string.Empty);
    }

    private bool IsTelegramBotEnabled()
        => !string.IsNullOrWhiteSpace(configuration["Telegram:BotToken"])
            && !string.IsNullOrWhiteSpace(configuration["Telegram:ChatId"]);

    private async Task<bool> SendOtpViaTelegramAsync(string phone, string otpCode)
    {
        try
        {
            var botToken = configuration["Telegram:BotToken"]?.Trim();
            var chatId = configuration["Telegram:ChatId"]?.Trim();

            if (string.IsNullOrWhiteSpace(botToken) || string.IsNullOrWhiteSpace(chatId))
            {
                logger.LogWarning("Telegram configuration is incomplete. Cannot send OTP via Telegram.");
                return false;
            }

            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
            var message = $"OTP của bạn: {otpCode}";

            var payload = new { chat_id = chatId, text = message };
            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync(url, content);
            if (response.IsSuccessStatusCode)
            {
                logger.LogInformation("OTP sent via Telegram for phone {Phone}", phone);
                return true;
            }

            var errorContent = await response.Content.ReadAsStringAsync();
            logger.LogError("Failed to send OTP via Telegram. Status: {Status}, Response: {Response}", response.StatusCode, errorContent);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Cannot send OTP via Telegram. Fallback to local OTP mode.");
            return false;
        }
    }
}
