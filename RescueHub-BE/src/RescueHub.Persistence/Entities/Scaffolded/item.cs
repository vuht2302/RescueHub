using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class item
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public Guid item_category_id { get; set; }

    public string unit_code { get; set; } = null!;

    public bool requires_lot_tracking { get; set; }

    public bool requires_expiry_tracking { get; set; }

    public string issue_policy_code { get; set; } = null!;

    public DateOnly? exp_date { get; set; }

    public DateTime received_at { get; set; }

    public bool is_active { get; set; }

    public virtual ICollection<distribution_line> distribution_lines { get; set; } = new List<distribution_line>();

    public virtual item_category item_category { get; set; } = null!;

    public virtual ICollection<item_lot> item_lots { get; set; } = new List<item_lot>();

    public virtual ICollection<relief_issue_line> relief_issue_lines { get; set; } = new List<relief_issue_line>();

    public virtual ICollection<relief_request_item> relief_request_items { get; set; } = new List<relief_request_item>();

    public virtual ICollection<stock_alert> stock_alerts { get; set; } = new List<stock_alert>();

    public virtual ICollection<stock_balance> stock_balances { get; set; } = new List<stock_balance>();

    public virtual ICollection<stock_transaction_line> stock_transaction_lines { get; set; } = new List<stock_transaction_line>();
}
