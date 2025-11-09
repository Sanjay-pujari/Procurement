using System;
using Microsoft.AspNetCore.Identity;

namespace ProcurePro.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? DisplayName { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CompanyName { get; set; }
        public string? VendorCategory { get; set; }
        public Guid? VendorId { get; set; }
    }
}
