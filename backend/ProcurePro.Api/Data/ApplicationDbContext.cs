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
        public DbSet<RFQAttachment> RFQAttachments => Set<RFQAttachment>();
        public DbSet<VendorQuotation> VendorQuotations => Set<VendorQuotation>();
        public DbSet<VendorQuotationItem> VendorQuotationItems => Set<VendorQuotationItem>();
        public DbSet<VendorQuotationAttachment> VendorQuotationAttachments => Set<VendorQuotationAttachment>();
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

            builder.Entity<RFQ>()
                .HasIndex(r => r.ReferenceNumber)
                .IsUnique();

            builder.Entity<RFQItem>().HasOne(i => i.RFQ)
                .WithMany(r => r.Items)
                .HasForeignKey(i => i.RFQId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<RFQAttachment>().HasOne(a => a.RFQ)
                .WithMany(r => r.Attachments)
                .HasForeignKey(a => a.RFQId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<RFQVendor>().HasOne(v => v.RFQ)
                .WithMany(r => r.RFQVendors)
                .HasForeignKey(v => v.RFQId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<VendorQuotation>()
                .HasOne(vq => vq.RFQ)
                .WithMany()
                .HasForeignKey(vq => vq.RFQId);

            builder.Entity<VendorQuotation>()
                .HasOne(vq => vq.Vendor)
                .WithMany()
                .HasForeignKey(vq => vq.VendorId);

            builder.Entity<VendorQuotationItem>()
                .HasOne(i => i.VendorQuotation)
                .WithMany(vq => vq.Items)
                .HasForeignKey(i => i.VendorQuotationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<VendorQuotationItem>()
                .HasOne(i => i.RFQItem)
                .WithMany()
                .HasForeignKey(i => i.RFQItemId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<VendorQuotationAttachment>()
                .HasOne(a => a.VendorQuotation)
                .WithMany(vq => vq.Attachments)
                .HasForeignKey(a => a.VendorQuotationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<VendorQuotation>()
                .Property(q => q.Subtotal)
                .HasColumnType("decimal(18,2)");
            builder.Entity<VendorQuotation>()
                .Property(q => q.TaxAmount)
                .HasColumnType("decimal(18,2)");
            builder.Entity<VendorQuotation>()
                .Property(q => q.TotalAmount)
                .HasColumnType("decimal(18,2)");

            builder.Entity<VendorQuotationItem>()
                .Property(i => i.Quantity)
                .HasColumnType("decimal(18,4)");
            builder.Entity<VendorQuotationItem>()
                .Property(i => i.UnitPrice)
                .HasColumnType("decimal(18,4)");
            builder.Entity<VendorQuotationItem>()
                .Property(i => i.LineTotal)
                .HasColumnType("decimal(18,2)");

            builder.Entity<BidItem>().HasOne(i => i.Bid)
                .WithMany(b => b.Items)
                .HasForeignKey(i => i.BidId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PurchaseOrder>()
                .HasIndex(po => po.PurchaseOrderNumber)
                .IsUnique()
                .HasFilter("[PurchaseOrderNumber] IS NOT NULL");

            builder.Entity<PurchaseOrder>()
                .HasOne(po => po.Vendor)
                .WithMany()
                .HasForeignKey(po => po.VendorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PurchaseOrder>()
                .HasOne(po => po.VendorQuotation)
                .WithOne(vq => vq.PurchaseOrder)
                .HasForeignKey<PurchaseOrder>(po => po.VendorQuotationId)
                .OnDelete(DeleteBehavior.Restrict);

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
