using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class RoleManagementController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<Models.ApplicationUser> _userManager;

        public RoleManagementController(RoleManager<IdentityRole> roleManager, UserManager<Models.ApplicationUser> userManager)
        {
            _roleManager = roleManager;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult> GetAllRoles()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            var roleList = new List<object>();

            foreach (var role in roles)
            {
                var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
                roleList.Add(new
                {
                    role.Id,
                    role.Name,
                    UserCount = usersInRole.Count
                });
            }

            return Ok(roleList);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetRole(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null) return NotFound();

            var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
            return Ok(new
            {
                role.Id,
                role.Name,
                Users = usersInRole.Select(u => new { u.Id, u.Email, u.DisplayName })
            });
        }

        [HttpPost]
        public async Task<ActionResult> CreateRole(CreateRoleRequest request)
        {
            var role = new IdentityRole(request.Name);
            var result = await _roleManager.CreateAsync(role);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return CreatedAtAction(nameof(GetRole), new { id = role.Id }, role);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateRole(string id, UpdateRoleRequest request)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null) return NotFound();

            role.Name = request.Name;
            var result = await _roleManager.UpdateAsync(role);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRole(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null) return NotFound();

            // Check if role is a system role
            var systemRoles = new[] { "Admin", "ProcurementManager", "Approver", "Vendor" };
            if (systemRoles.Contains(role.Name))
                return BadRequest("Cannot delete system roles");

            var result = await _roleManager.DeleteAsync(role);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpPost("{roleId}/users/{userId}")]
        public async Task<ActionResult> AddUserToRole(string roleId, string userId)
        {
            var role = await _roleManager.FindByIdAsync(roleId);
            if (role == null) return NotFound("Role not found");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found");

            var result = await _userManager.AddToRoleAsync(user, role.Name!);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpDelete("{roleId}/users/{userId}")]
        public async Task<ActionResult> RemoveUserFromRole(string roleId, string userId)
        {
            var role = await _roleManager.FindByIdAsync(roleId);
            if (role == null) return NotFound("Role not found");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found");

            var result = await _userManager.RemoveFromRoleAsync(user, role.Name!);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }
    }

    public record CreateRoleRequest(string Name);
    public record UpdateRoleRequest(string Name);
}

