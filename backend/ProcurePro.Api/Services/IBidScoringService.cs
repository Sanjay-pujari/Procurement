using ProcurePro.Api.Modules;

namespace ProcurePro.Api.Services
{
    public interface IBidScoringService
    {
        double ComputeScore(Bid bid);
    }

    public class BidScoringService : IBidScoringService
    {
        public double ComputeScore(Bid bid)
        {
            var amount = (double)bid.TotalAmount;
            return amount <= 0 ? 0 : Math.Min(100, 100000 / amount);
        }
    }
}
