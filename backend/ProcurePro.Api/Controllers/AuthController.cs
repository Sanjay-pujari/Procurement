using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ProcurePro.Api.DTO;
using ProcurePro.Api.Models;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _users;
        private readonly SignInManager<ApplicationUser> _signin;
        private readonly ProcurePro.Api.JwtSettings _jwt;

        public AuthController(UserManager<ApplicationUser> users, SignInManager<ApplicationUser> signin, IOptions<ProcurePro.Api.JwtSettings> jwt)
        {
            _users = users; _signin = signin; _jwt = jwt.Value;
        }

        [HttpPost("login")]
        public async Task<ActionResult<TokenResponse>> Login([FromBody] LoginRequest req)
        {
            var user = await _users.FindByEmailAsync(req.Email);
            if (user == null) return Unauthorized();

            var result = await _signin.CheckPasswordSignInAsync(user, req.Password, true);
            if (!result.Succeeded) return Unauthorized();

            var roles = await _users.GetRolesAsync(user);
            var token = GenerateJwt(user, roles);
            return Ok(token);
        }

        [AllowAnonymous]
        [HttpPost("register-vendor")]
        public async Task<ActionResult<TokenResponse>> RegisterVendor([FromBody] RegisterVendorRequest req)
        {
            var exists = await _users.FindByEmailAsync(req.Email);
            if (exists != null) return Conflict("Email already registered");

            var user = new ApplicationUser
            {
                UserName = req.Email,
                Email = req.Email,
                CompanyName = req.CompanyName,
                VendorCategory = req.Category,
                DisplayName = req.CompanyName
            };
            var created = await _users.CreateAsync(user, req.Password);
            if (!created.Succeeded) return BadRequest(created.Errors);

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
