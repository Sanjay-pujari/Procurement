using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Models;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.Data
{
    public class DataSeeder
    {
        private readonly RoleManager<IdentityRole> _roles;
        private readonly UserManager<ApplicationUser> _users;
        private readonly ApplicationDbContext _context;
        private static readonly string[] RoleNames = new[] { "Admin", "ProcurementManager", "Approver", "Vendor" };

        public DataSeeder(RoleManager<IdentityRole> roles, UserManager<ApplicationUser> users, ApplicationDbContext context)
        {
            _roles = roles; _users = users; _context = context;
        }

        public async Task SeedAsync()
        {
            // Seed Roles
            foreach (var role in RoleNames)
            {
                if (!await _roles.RoleExistsAsync(role))
                    await _roles.CreateAsync(new IdentityRole(role));
            }

            // Seed Admin User
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

            // Seed Sample Vendors
            if (!await _context.Vendors.AnyAsync())
            {
                var vendors = new List<Vendor>
                {
                    new Vendor { Id = Guid.NewGuid(), CompanyName = "Tech Solutions Inc", Email = "contact@techsolutions.com", Category = "IT Services", PerformanceRating = 4.5, VerificationStatus = VendorVerificationStatus.Approved, IsActive = true, VerifiedAt = DateTime.UtcNow },
                    new Vendor { Id = Guid.NewGuid(), CompanyName = "Office Supplies Co", Email = "sales@officesupplies.com", Category = "Office Equipment", PerformanceRating = 4.2, VerificationStatus = VendorVerificationStatus.Approved, IsActive = true, VerifiedAt = DateTime.UtcNow },
                    new Vendor { Id = Guid.NewGuid(), CompanyName = "Construction Materials Ltd", Email = "info@constmaterials.com", Category = "Construction", PerformanceRating = 4.7, VerificationStatus = VendorVerificationStatus.Approved, IsActive = true, VerifiedAt = DateTime.UtcNow },
                    new Vendor { Id = Guid.NewGuid(), CompanyName = "Green Energy Solutions", Email = "sales@greenenergy.com", Category = "Energy", PerformanceRating = 4.8, VerificationStatus = VendorVerificationStatus.Approved, IsActive = true, VerifiedAt = DateTime.UtcNow },
                    new Vendor { Id = Guid.NewGuid(), CompanyName = "Medical Supplies Pro", Email = "orders@medsupplies.com", Category = "Healthcare", PerformanceRating = 4.6, VerificationStatus = VendorVerificationStatus.Approved, IsActive = true, VerifiedAt = DateTime.UtcNow }
                };
                await _context.Vendors.AddRangeAsync(vendors);
                await _context.SaveChangesAsync();

                var historyEntries = vendors.Select(v => new VendorStatusHistory
                {
                    Id = Guid.NewGuid(),
                    VendorId = v.Id,
                    Status = VendorVerificationStatus.Approved,
                    ChangedAt = v.VerifiedAt ?? DateTime.UtcNow,
                    Remarks = "Seeded vendor approved."
                });
                await _context.VendorStatusHistories.AddRangeAsync(historyEntries);
                await _context.SaveChangesAsync();
            }

            // Seed Sample RFQs
            if (!await _context.RFQs.AnyAsync())
            {
                var vendorIds = await _context.Vendors.Select(v => v.Id).Take(5).ToListAsync();
                
                var rfq1 = new RFQ
                {
                    Id = Guid.NewGuid(),
                    Title = "Office Furniture and Equipment",
                    Terms = "Payment within 30 days. Delivery required within 2 weeks of PO.",
                    DueDate = DateTime.UtcNow.AddDays(15),
                    Status = RFQStatus.Published,
                    Items = new List<RFQItem>
                    {
                        new RFQItem { Id = Guid.NewGuid(), Description = "Executive Office Desk", Specification = "Wood finish, L-shaped, 1.8m x 1.6m", Quantity = 10, Unit = "pieces" },
                        new RFQItem { Id = Guid.NewGuid(), Description = "Ergonomic Office Chair", Specification = "Mesh back, adjustable height, lumbar support", Quantity = 25, Unit = "pieces" },
                        new RFQItem { Id = Guid.NewGuid(), Description = "Filing Cabinet", Specification = "4-drawer, steel, lockable", Quantity = 8, Unit = "pieces" }
                    },
                    RFQVendors = vendorIds.Take(2).Select(vId => new RFQVendor { Id = Guid.NewGuid(), VendorId = vId }).ToList()
                };

                var rfq2 = new RFQ
                {
                    Id = Guid.NewGuid(),
                    Title = "IT Hardware Procurement",
                    Terms = "1-year warranty required. Payment: 50% advance, 50% on delivery.",
                    DueDate = DateTime.UtcNow.AddDays(20),
                    Status = RFQStatus.Published,
                    Items = new List<RFQItem>
                    {
                        new RFQItem { Id = Guid.NewGuid(), Description = "Desktop Computer", Specification = "Intel i7, 16GB RAM, 512GB SSD, Windows 11 Pro", Quantity = 50, Unit = "units" },
                        new RFQItem { Id = Guid.NewGuid(), Description = "Laptop", Specification = "Intel i5, 8GB RAM, 256GB SSD, 14-inch display", Quantity = 30, Unit = "units" },
                        new RFQItem { Id = Guid.NewGuid(), Description = "Network Switch", Specification = "24-port Gigabit managed switch", Quantity = 5, Unit = "units" }
                    },
                    RFQVendors = vendorIds.Skip(1).Take(3).Select(vId => new RFQVendor { Id = Guid.NewGuid(), VendorId = vId }).ToList()
                };

                var rfq3 = new RFQ
                {
                    Id = Guid.NewGuid(),
                    Title = "Medical Equipment and Supplies",
                    Terms = "ISO certification required. Delivery in batches over 3 months.",
                    DueDate = DateTime.UtcNow.AddDays(10),
                    Status = RFQStatus.Closed,
                    Items = new List<RFQItem>
                    {
                        new RFQItem { Id = Guid.NewGuid(), Description = "Surgical Gloves", Specification = "Latex-free, sterile, size M/L", Quantity = 10000, Unit = "pairs" },
                        new RFQItem { Id = Guid.NewGuid(), Description = "Face Masks", Specification = "N95, NIOSH certified", Quantity = 5000, Unit = "pieces" },
                        new RFQItem { Id = Guid.NewGuid(), Description = "Digital Thermometer", Specification = "Non-contact, infrared", Quantity = 100, Unit = "units" }
                    },
                    RFQVendors = vendorIds.Skip(3).Take(2).Select(vId => new RFQVendor { Id = Guid.NewGuid(), VendorId = vId }).ToList()
                };

                await _context.RFQs.AddRangeAsync(rfq1, rfq2, rfq3);
                await _context.SaveChangesAsync();

                // Seed RFPs
                var rfps = new List<RFP>
                {
                    new RFP 
                    { 
                        Id = Guid.NewGuid(), 
                        RFQId = rfq1.Id, 
                        Title = "Proposal for Office Furniture Supply",
                        Requirements = "Include delivery schedule, warranty terms, and installation services",
                        EvaluationCriteria = "Price (40%), Quality (30%), Delivery timeline (20%), Past performance (10%)"
                    },
                    new RFP 
                    { 
                        Id = Guid.NewGuid(), 
                        RFQId = rfq2.Id, 
                        Title = "IT Hardware Supply and Support Proposal",
                        Requirements = "Must include technical support for 1 year, training materials, and deployment assistance",
                        EvaluationCriteria = "Total cost (35%), Technical specifications (30%), Support services (20%), Vendor experience (15%)"
                    }
                };
                await _context.RFPs.AddRangeAsync(rfps);

                // Seed RFIs
                var rfis = new List<RFI>
                {
                    new RFI 
                    { 
                        Id = Guid.NewGuid(), 
                        RFQId = rfq1.Id, 
                        Title = "Information Request: Furniture Manufacturing Capabilities",
                        QuestionnaireJson = "[{\"question\":\"Production capacity per month?\",\"type\":\"text\"},{\"question\":\"Lead time for custom orders?\",\"type\":\"text\"},{\"question\":\"Quality certifications held?\",\"type\":\"text\"}]"
                    },
                    new RFI 
                    { 
                        Id = Guid.NewGuid(), 
                        RFQId = rfq3.Id, 
                        Title = "Information Request: Medical Supply Chain and Certifications",
                        QuestionnaireJson = "[{\"question\":\"FDA/ISO certifications?\",\"type\":\"text\"},{\"question\":\"Supply chain reliability?\",\"type\":\"text\"},{\"question\":\"Emergency order capabilities?\",\"type\":\"text\"}]"
                    }
                };
                await _context.RFIs.AddRangeAsync(rfis);

                // Seed Bids
                var bids = new List<Bid>
                {
                    new Bid
                    {
                        Id = Guid.NewGuid(),
                        RFQId = rfq1.Id,
                        VendorId = vendorIds[0],
                        Visibility = TenderVisibility.Closed,
                        TotalAmount = 45000m,
                        Score = 85.5,
                        SubmittedAt = DateTime.UtcNow.AddDays(-5),
                        Items = new List<BidItem>
                        {
                            new BidItem { Id = Guid.NewGuid(), Description = "Executive Office Desk", Quantity = 10, UnitPrice = 1500m },
                            new BidItem { Id = Guid.NewGuid(), Description = "Ergonomic Office Chair", Quantity = 25, UnitPrice = 800m },
                            new BidItem { Id = Guid.NewGuid(), Description = "Filing Cabinet", Quantity = 8, UnitPrice = 625m }
                        }
                    },
                    new Bid
                    {
                        Id = Guid.NewGuid(),
                        RFQId = rfq1.Id,
                        VendorId = vendorIds[1],
                        Visibility = TenderVisibility.Closed,
                        TotalAmount = 48500m,
                        Score = 82.3,
                        SubmittedAt = DateTime.UtcNow.AddDays(-4),
                        Items = new List<BidItem>
                        {
                            new BidItem { Id = Guid.NewGuid(), Description = "Executive Office Desk", Quantity = 10, UnitPrice = 1600m },
                            new BidItem { Id = Guid.NewGuid(), Description = "Ergonomic Office Chair", Quantity = 25, UnitPrice = 850m },
                            new BidItem { Id = Guid.NewGuid(), Description = "Filing Cabinet", Quantity = 8, UnitPrice = 700m }
                        }
                    },
                    new Bid
                    {
                        Id = Guid.NewGuid(),
                        RFQId = rfq2.Id,
                        VendorId = vendorIds[2],
                        Visibility = TenderVisibility.Closed,
                        TotalAmount = 125000m,
                        Score = 90.2,
                        SubmittedAt = DateTime.UtcNow.AddDays(-3),
                        Items = new List<BidItem>
                        {
                            new BidItem { Id = Guid.NewGuid(), Description = "Desktop Computer", Quantity = 50, UnitPrice = 1200m },
                            new BidItem { Id = Guid.NewGuid(), Description = "Laptop", Quantity = 30, UnitPrice = 1500m },
                            new BidItem { Id = Guid.NewGuid(), Description = "Network Switch", Quantity = 5, UnitPrice = 2000m }
                        }
                    }
                };
                await _context.Bids.AddRangeAsync(bids);
                await _context.SaveChangesAsync();

                // Seed Purchase Orders
                var purchaseOrders = new List<PurchaseOrder>
                {
                    new PurchaseOrder
                    {
                        Id = Guid.NewGuid(),
                        BidId = bids[0].Id,
                        Status = POStatus.Acknowledged,
                        AmendmentsJson = null,
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    new PurchaseOrder
                    {
                        Id = Guid.NewGuid(),
                        BidId = bids[2].Id,
                        Status = POStatus.Issued,
                        AmendmentsJson = null,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    }
                };
                await _context.PurchaseOrders.AddRangeAsync(purchaseOrders);
                await _context.SaveChangesAsync();

                // Seed Invoices
                var invoices = new List<Invoice>
                {
                    new Invoice
                    {
                        Id = Guid.NewGuid(),
                        PurchaseOrderId = purchaseOrders[0].Id,
                        Amount = 22500m, // 50% advance
                        PaymentStatus = PaymentStatus.Paid,
                        SubmittedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new Invoice
                    {
                        Id = Guid.NewGuid(),
                        PurchaseOrderId = purchaseOrders[0].Id,
                        Amount = 22500m, // Remaining 50%
                        PaymentStatus = PaymentStatus.Pending,
                        SubmittedAt = DateTime.UtcNow
                    },
                    new Invoice
                    {
                        Id = Guid.NewGuid(),
                        PurchaseOrderId = purchaseOrders[1].Id,
                        Amount = 125000m,
                        PaymentStatus = PaymentStatus.Pending,
                        SubmittedAt = DateTime.UtcNow
                    }
                };
                await _context.Invoices.AddRangeAsync(invoices);
                await _context.SaveChangesAsync();
            }
        }
    }
}
