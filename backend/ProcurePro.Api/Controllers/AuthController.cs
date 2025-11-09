using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ProcurePro.Api.Data;
using ProcurePro.Api.DTO;
using ProcurePro.Api.Models;
using ProcurePro.Api.Modules;
using ProcurePro.Api.Services;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _users;
        private readonly SignInManager<ApplicationUser> _signin;
        private readonly ProcurePro.Api.JwtSettings _jwt;
        private readonly INotificationService _notifications;
        private readonly ApplicationDbContext _db;

        public AuthController(
            UserManager<ApplicationUser> users,
            SignInManager<ApplicationUser> signin,
            IOptions<ProcurePro.Api.JwtSettings> jwt,
            INotificationService notifications,
            ApplicationDbContext db)
        {
            _users = users;
            _signin = signin;
            _jwt = jwt.Value;
            _notifications = notifications;
            _db = db;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
        {
            var user = await _users.FindByEmailAsync(req.Email);
            if (user == null) return Unauthorized();

            if (!user.IsActive)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "User account is deactivated." });

            if (!string.IsNullOrWhiteSpace(req.TwoFactorCode))
            {
                var passwordValid = await _users.CheckPasswordAsync(user, req.Password);
                if (!passwordValid) return Unauthorized();

                var twoFactorEnabled = await _users.GetTwoFactorEnabledAsync(user);
                if (!twoFactorEnabled)
                    return BadRequest("Two-factor authentication is not enabled for this user.");

                var isValidCode = await _users.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultEmailProvider, req.TwoFactorCode);
                if (!isValidCode)
                    return Unauthorized("Invalid two-factor authentication code.");

                var verifiedRoles = await _users.GetRolesAsync(user);
                var verifiedToken = GenerateJwt(user, verifiedRoles);
                return Ok(new LoginResponse(false, verifiedToken, null));
            }

            var result = await _signin.CheckPasswordSignInAsync(user, req.Password, true);

            if (result.IsLockedOut)
                return StatusCode(StatusCodes.Status423Locked, new { message = "Account locked. Too many failed attempts." });

            if (result.RequiresTwoFactor)
            {
                var twoFactorEnabled = await _users.GetTwoFactorEnabledAsync(user);
                if (!twoFactorEnabled)
                {
                    var fallbackRoles = await _users.GetRolesAsync(user);
                    var fallbackToken = GenerateJwt(user, fallbackRoles);
                    return Ok(new LoginResponse(false, fallbackToken, null));
                }

                var code = await _users.GenerateTwoFactorTokenAsync(user, TokenOptions.DefaultEmailProvider);
                if (!string.IsNullOrWhiteSpace(user.Email))
                {
                    await _notifications.SendEmailAsync(user.Email, "ProcurePro Verification Code", $"Your verification code is {code}");
                }
                return Ok(new LoginResponse(true, null, "email"));
            }

            if (!result.Succeeded)
                return Unauthorized();

            var roles = await _users.GetRolesAsync(user);
            var token = GenerateJwt(user, roles);
            return Ok(new LoginResponse(false, token, null));
        }

        [AllowAnonymous]
        [HttpPost("register-vendor")]
        public async Task<ActionResult<TokenResponse>> RegisterVendor([FromBody] RegisterVendorRequest req)
        {
            var exists = await _users.FindByEmailAsync(req.Email);
            if (exists != null) return Conflict("Email already registered");

            var vendor = new Vendor
            {
                Id = Guid.NewGuid(),
                CompanyName = req.CompanyName,
                Email = req.Email,
                Category = req.Category,
                Phone = null,
                VerificationStatus = VendorVerificationStatus.PendingReview,
                IsActive = false
            };
            _db.Vendors.Add(vendor);
            _db.VendorStatusHistories.Add(new VendorStatusHistory
            {
                Id = Guid.NewGuid(),
                VendorId = vendor.Id,
                Status = VendorVerificationStatus.PendingReview,
                Remarks = "Vendor self-registration submitted."
            });

            var user = new ApplicationUser
            {
                UserName = req.Email,
                Email = req.Email,
                CompanyName = req.CompanyName,
                VendorCategory = req.Category,
                DisplayName = req.CompanyName,
                EmailConfirmed = true,
                IsActive = true,
                VendorId = vendor.Id
            };
            var created = await _users.CreateAsync(user, req.Password);
            if (!created.Succeeded)
            {
                _db.Vendors.Remove(vendor);
                await _db.SaveChangesAsync();
                return BadRequest(created.Errors);
            }

            await _db.SaveChangesAsync();
            await _users.AddToRoleAsync(user, "Vendor");
            var roles = await _users.GetRolesAsync(user);
            return Ok(GenerateJwt(user, roles));
        }

        private TokenResponse GenerateJwt(ApplicationUser user, IEnumerable<string> roles)
        {
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id),
                new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                new(ClaimTypes.Name, user.DisplayName ?? user.Email ?? ""),
            };
            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret ?? "Dev_ChangeMe"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes > 0 ? _jwt.ExpiryMinutes : 120);

            var token = new JwtSecurityToken(
                issuer: _jwt.Issuer,
                audience: _jwt.Audience,
                claims: claims,
                expires: expires,
                signingCredentials: creds);
            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return new TokenResponse(jwt, expires, roles.ToArray(), user.DisplayName);
        }
    }
}
