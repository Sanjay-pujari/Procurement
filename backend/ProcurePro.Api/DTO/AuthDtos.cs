namespace ProcurePro.Api.DTO
{
    public record LoginRequest(string Email, string Password);
    public record TokenResponse(string AccessToken, DateTime ExpiresAt, string[] Roles, string? DisplayName);
    public record RegisterVendorRequest(string CompanyName, string Email, string Password, string? Category);
}
