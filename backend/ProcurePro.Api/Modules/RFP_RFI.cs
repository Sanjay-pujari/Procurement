namespace ProcurePro.Api.Modules
{
    public class RFP
    {
        public Guid Id { get; set; }
        public Guid RFQId { get; set; }
        public string Title { get; set; } = default!;
        public string? Requirements { get; set; }
        public string? EvaluationCriteria { get; set; }
    }

    public class RFI
    {
        public Guid Id { get; set; }
        public Guid? RFQId { get; set; }
        public Guid? RFPId { get; set; }
        public string Title { get; set; } = default!;
        public string? QuestionnaireJson { get; set; }
    }
}
