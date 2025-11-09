using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Models;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Vendor> Vendors => Set<Vendor>();
        public DbSet<VendorDocument> VendorDocuments => Set<VendorDocument>();
        public DbSet<VendorStatusHistory> VendorStatusHistories => Set<VendorStatusHistory>();
        public DbSet<RFQ> RFQs => Set<RFQ>();
        public DbSet<RFQItem> RFQItems => Set<RFQItem>();
        public DbSet<RFQVendor> RFQVendors => Set<RFQVendor>();
        public DbSet<RFP> RFPs => Set<RFP>();
        public DbSet<RFI> RFIs => Set<RFI>();
        public DbSet<Bid> Bids => Set<Bid>();
        public DbSet<BidItem> BidItems => Set<BidItem>();
        public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<PurchaseRequisition> PurchaseRequisitions => Set<PurchaseRequisition>();
        public DbSet<PurchaseRequisitionItem> PurchaseRequisitionItems => Set<PurchaseRequisitionItem>();
        public DbSet<PurchaseRequisitionAttachment> PurchaseRequisitionAttachments => Set<PurchaseRequisitionAttachment>();
        public DbSet<PurchaseRequisitionApproval> PurchaseRequisitionApprovals => Set<PurchaseRequisitionApproval>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Vendor>().HasIndex(v => v.Email).IsUnique();
            builder.Entity<Vendor>()
                .HasMany(v => v.Documents)
                .WithOne(d => d.Vendor)
                .HasForeignKey(d => d.VendorId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Vendor>()
                .HasMany(v => v.StatusHistory)
                .WithOne(h => h.Vendor)
                .HasForeignKey(h => h.VendorId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<RFQItem>().HasOne(i => i.RFQ)
                .WithMany(r => r.Items)
                .HasForeignKey(i => i.RFQId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<BidItem>().HasOne(i => i.Bid)
                .WithMany(b => b.Items)
                .HasForeignKey(i => i.BidId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PurchaseRequisition>()
                .HasIndex(pr => pr.PrNumber)
                .IsUnique();

            builder.Entity<PurchaseRequisitionItem>()
                .Property(i => i.EstimatedUnitCost)
                .HasColumnType("decimal(18,2)");

            builder.Entity<PurchaseRequisitionItem>()
                .HasOne(i => i.PurchaseRequisition)
                .WithMany(pr => pr.Items)
                .HasForeignKey(i => i.PurchaseRequisitionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PurchaseRequisitionAttachment>()
                .HasOne(a => a.PurchaseRequisition)
                .WithMany(pr => pr.Attachments)
                .HasForeignKey(a => a.PurchaseRequisitionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PurchaseRequisitionApproval>()
                .HasOne(a => a.PurchaseRequisition)
                .WithMany(pr => pr.Approvals)
                .HasForeignKey(a => a.PurchaseRequisitionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
