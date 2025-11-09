using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.DTO;
using ProcurePro.Api.Models;
using ProcurePro.Api.Modules;
using ProcurePro.Api.Services;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,ProcurementManager,Approver")]
    public class PurchaseRequisitionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _users;
        private readonly INotificationService _notification;

        public PurchaseRequisitionsController(ApplicationDbContext db, UserManager<ApplicationUser> users, INotificationService notification)
        {
            _db = db;
            _users = users;
            _notification = notification;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseRequisitionSummaryDto>>> GetAll()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isManager = User.IsInRole("Admin") || User.IsInRole("ProcurementManager");

            var query = _db.PurchaseRequisitions.AsNoTracking();
            if (!isManager && !string.IsNullOrEmpty(userId))
            {
                query = query.Where(pr =>
                    pr.RequestedByUserId == userId ||
                    pr.Approvals.Any(a => a.ApproverUserId == userId));
            }

            var list = await query
                .OrderByDescending(pr => pr.CreatedAt)
                .Select(pr => new PurchaseRequisitionSummaryDto(
                    pr.Id,
                    pr.PrNumber,
                    pr.Title,
                    pr.Status,
                    pr.Urgency,
                    pr.NeededBy,
                    pr.CreatedAt,
                    pr.RequestedByUserId))
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<PurchaseRequisitionDetailDto>> Get(Guid id)
        {
            var pr = await _db.PurchaseRequisitions
                .AsNoTracking()
                .Include(pr => pr.Items)
                .Include(pr => pr.Attachments)
                .Include(pr => pr.Approvals)
                .FirstOrDefaultAsync(pr => pr.Id == id);

            if (pr == null) return NotFound();

            var detail = new PurchaseRequisitionDetailDto(
                pr.Id,
                pr.PrNumber,
                pr.Title,
                pr.Description,
                pr.CostCenter,
                pr.Department,
                pr.Urgency,
                pr.Status,
                pr.NeededBy,
                pr.CreatedAt,
                pr.SubmittedAt,
                pr.ApprovedAt,
                pr.RequestedByUserId,
                pr.Items.Select(i => new PurchaseRequisitionItemDto(i.Id, i.ItemName, i.Specification, i.Quantity, i.UnitOfMeasure, i.EstimatedUnitCost)).ToList(),
                pr.Attachments.Select(a => new PurchaseRequisitionAttachmentDto(a.Id, a.FileName, a.StorageUrl, a.UploadedByUserId, a.UploadedAt)).ToList(),
                pr.Approvals
                    .OrderBy(a => a.Sequence)
                    .Select(a => new PurchaseRequisitionApprovalDto(a.Id, a.Sequence, a.ApproverUserId, a.Status, a.ActionedAt, a.Comments))
                    .ToList());

            return Ok(detail);
        }

        [HttpPost]
        public async Task<ActionResult<PurchaseRequisitionDetailDto>> Create([FromBody] CreatePurchaseRequisitionRequest request)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(requesterId)) return Unauthorized();

            if (request.Items == null || !request.Items.Any())
                return BadRequest("Purchase requisition requires at least one item.");

            var validApproverIds = request.ApproverUserIds?.Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToList() ?? new List<string>();
            if (!validApproverIds.Any())
                return BadRequest("At least one approver is required.");

            var approversExist = await _users.Users.Where(u => validApproverIds.Contains(u.Id)).Select(u => u.Id).ToListAsync();
            if (approversExist.Count != validApproverIds.Count)
                return BadRequest("One or more approvers could not be found.");

            var pr = new PurchaseRequisition
            {
                Id = Guid.NewGuid(),
                PrNumber = await GeneratePrNumberAsync(),
                Title = request.Title,
                Description = request.Description,
                CostCenter = request.CostCenter,
                Department = request.Department,
                Urgency = request.Urgency,
                NeededBy = request.NeededBy,
                RequestedByUserId = requesterId,
                Status = PurchaseRequisitionStatus.Draft,
                Items = request.Items.Select(item => new PurchaseRequisitionItem
                {
                    Id = Guid.NewGuid(),
                    ItemName = item.ItemName,
                    Specification = item.Specification,
                    Quantity = item.Quantity,
                    UnitOfMeasure = item.UnitOfMeasure,
                    EstimatedUnitCost = item.EstimatedUnitCost
                }).ToList(),
                Attachments = request.Attachments?.Select(att => new PurchaseRequisitionAttachment
                {
                    Id = Guid.NewGuid(),
                    FileName = att.FileName,
                    StorageUrl = att.StorageUrl,
                    UploadedByUserId = requesterId
                }).ToList() ?? new List<PurchaseRequisitionAttachment>(),
                Approvals = validApproverIds
                    .Select((approverId, index) => new PurchaseRequisitionApproval
                    {
                        Id = Guid.NewGuid(),
                        Sequence = index + 1,
                        ApproverUserId = approverId,
                        Status = PurchaseRequisitionApprovalStatus.NotStarted
                    }).ToList()
            };

            _db.PurchaseRequisitions.Add(pr);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = pr.Id }, await MapDetailAsync(pr.Id));
        }

        [HttpPost("{id:guid}/submit")]
        public async Task<ActionResult> Submit(Guid id, [FromBody] SubmitPurchaseRequisitionRequest request)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(requesterId)) return Unauthorized();

            var pr = await _db.PurchaseRequisitions
                .Include(pr => pr.Approvals)
                .FirstOrDefaultAsync(pr => pr.Id == id);
            if (pr == null) return NotFound();

            if (pr.RequestedByUserId != requesterId && !User.IsInRole("Admin") && !User.IsInRole("ProcurementManager"))
                return Forbid();

            if (pr.Status != PurchaseRequisitionStatus.Draft)
                return BadRequest("Only draft requisitions can be submitted.");

            if (request?.ApproverUserIds != null && request.ApproverUserIds.Any())
            {
                pr.Approvals.Clear();
                var validApprovers = request.ApproverUserIds.Where(a => !string.IsNullOrWhiteSpace(a)).Distinct().ToList();
                if (!validApprovers.Any())
                    return BadRequest("At least one approver is required.");

                var approversExist = await _users.Users.Where(u => validApprovers.Contains(u.Id)).Select(u => u.Id).ToListAsync();
                if (approversExist.Count != validApprovers.Count)
                    return BadRequest("One or more approvers could not be found.");

                foreach (var (approverId, index) in validApprovers.Select((val, idx) => (val, idx)))
                {
                    pr.Approvals.Add(new PurchaseRequisitionApproval
                    {
                        Id = Guid.NewGuid(),
                        Sequence = index + 1,
                        ApproverUserId = approverId,
                        Status = PurchaseRequisitionApprovalStatus.NotStarted
                    });
                }
            }

            if (!pr.Approvals.Any())
                return BadRequest("Purchase requisition requires at least one approver.");

            pr.Status = PurchaseRequisitionStatus.PendingApproval;
            pr.SubmittedAt = DateTime.UtcNow;

            var firstApproval = pr.Approvals.OrderBy(a => a.Sequence).First();
            firstApproval.Status = PurchaseRequisitionApprovalStatus.Pending;

            await _db.SaveChangesAsync();

            await NotifyApproverAsync(firstApproval.ApproverUserId, $"PR {pr.PrNumber} requires your approval.");

            return NoContent();
        }

        [HttpPost("{id:guid}/approve")]
        public async Task<ActionResult> Approve(Guid id, [FromBody] ApprovalActionRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var pr = await _db.PurchaseRequisitions
                .Include(pr => pr.Approvals)
                .FirstOrDefaultAsync(pr => pr.Id == id);
            if (pr == null) return NotFound();

            if (pr.Status != PurchaseRequisitionStatus.PendingApproval)
                return BadRequest("Purchase requisition is not awaiting approval.");

            var approval = pr.Approvals.FirstOrDefault(a => a.ApproverUserId == userId && a.Status == PurchaseRequisitionApprovalStatus.Pending);
            if (approval == null)
                return Forbid();

            approval.Status = PurchaseRequisitionApprovalStatus.Approved;
            approval.ActionedAt = DateTime.UtcNow;
            approval.Comments = request?.Comments;

            var nextApproval = pr.Approvals
                .Where(a => a.Sequence > approval.Sequence)
                .OrderBy(a => a.Sequence)
                .FirstOrDefault();

            if (nextApproval != null)
            {
                nextApproval.Status = PurchaseRequisitionApprovalStatus.Pending;
                await _db.SaveChangesAsync();
                await NotifyApproverAsync(nextApproval.ApproverUserId, $"PR {pr.PrNumber} is ready for your approval.");
                return NoContent();
            }
            else
            {
                pr.Status = PurchaseRequisitionStatus.Approved;
                pr.ApprovedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id:guid}/reject")]
        public async Task<ActionResult> Reject(Guid id, [FromBody] ApprovalActionRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var pr = await _db.PurchaseRequisitions
                .Include(pr => pr.Approvals)
                .FirstOrDefaultAsync(pr => pr.Id == id);
            if (pr == null) return NotFound();

            if (pr.Status != PurchaseRequisitionStatus.PendingApproval)
                return BadRequest("Purchase requisition is not awaiting approval.");

            var approval = pr.Approvals.FirstOrDefault(a => a.ApproverUserId == userId && a.Status == PurchaseRequisitionApprovalStatus.Pending);
            if (approval == null)
                return Forbid();

            approval.Status = PurchaseRequisitionApprovalStatus.Rejected;
            approval.ActionedAt = DateTime.UtcNow;
            approval.Comments = request?.Comments;

            pr.Status = PurchaseRequisitionStatus.Rejected;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        private async Task NotifyApproverAsync(string approverUserId, string message)
        {
            var approver = await _users.FindByIdAsync(approverUserId);
            if (approver?.Email != null)
            {
                await _notification.SendEmailAsync(approver.Email, "Purchase Requisition Approval Needed", message);
            }
        }

        private async Task<string> GeneratePrNumberAsync()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
            var prNumber = $"PR-{timestamp}";
            var exists = await _db.PurchaseRequisitions.AnyAsync(pr => pr.PrNumber == prNumber);
            if (!exists) return prNumber;

            return $"PR-{timestamp}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
        }

        private async Task<PurchaseRequisitionDetailDto> MapDetailAsync(Guid id)
        {
            var pr = await _db.PurchaseRequisitions
                .AsNoTracking()
                .Include(pr => pr.Items)
                .Include(pr => pr.Attachments)
                .Include(pr => pr.Approvals)
                .FirstAsync(pr => pr.Id == id);

            return new PurchaseRequisitionDetailDto(
                pr.Id,
                pr.PrNumber,
                pr.Title,
                pr.Description,
                pr.CostCenter,
                pr.Department,
                pr.Urgency,
                pr.Status,
                pr.NeededBy,
                pr.CreatedAt,
                pr.SubmittedAt,
                pr.ApprovedAt,
                pr.RequestedByUserId,
                pr.Items.Select(i => new PurchaseRequisitionItemDto(i.Id, i.ItemName, i.Specification, i.Quantity, i.UnitOfMeasure, i.EstimatedUnitCost)).ToList(),
                pr.Attachments.Select(a => new PurchaseRequisitionAttachmentDto(a.Id, a.FileName, a.StorageUrl, a.UploadedByUserId, a.UploadedAt)).ToList(),
                pr.Approvals.OrderBy(a => a.Sequence)
                    .Select(a => new PurchaseRequisitionApprovalDto(a.Id, a.Sequence, a.ApproverUserId, a.Status, a.ActionedAt, a.Comments)).ToList());
        }
    }
}

