using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Models;

namespace ProcurePro.Api.Data
{
    public class DataSeeder
    {
        private readonly RoleManager<IdentityRole> _roles;
        private readonly UserManager<ApplicationUser> _users;
        private static readonly string[] RoleNames = new[] { "Admin", "ProcurementManager", "Approver", "Vendor" };

        public DataSeeder(RoleManager<IdentityRole> roles, UserManager<ApplicationUser> users)
        {
            _roles = roles; _users = users;
        }

        public async Task SeedAsync()
        {
            foreach (var role in RoleNames)
            {
                if (!await _roles.RoleExistsAsync(role))
                    await _roles.CreateAsync(new IdentityRole(role));
            }

            var adminEmail = "admin@procurepro.local";
            var admin = await _users.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
            if (admin == null)
            {
                admin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    DisplayName = "Administrator",
                    EmailConfirmed = true
                };
                await _users.CreateAsync(admin, "Admin#12345");
                await _users.AddToRoleAsync(admin, "Admin");
            }
        }
    }
}
