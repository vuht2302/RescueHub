using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class item_lot
{
    public Guid id { get; set; }

    public Guid item_id { get; set; }

    public string lot_no { get; set; } = null!;

    public DateOnly? mfg_date { get; set; }

    public DateOnly? exp_date { get; set; }

    public string? donor_name { get; set; }

    public DateTime received_at { get; set; }

    public string status_code { get; set; } = null!;

    public virtual ICollection<distribution_line> distribution_lines { get; set; } = new List<distribution_line>();

    public virtual item item { get; set; } = null!;

    public virtual ICollection<relief_issue_line> relief_issue_lines { get; set; } = new List<relief_issue_line>();

    public virtual ICollection<stock_alert> stock_alerts { get; set; } = new List<stock_alert>();

    public virtual ICollection<stock_balance> stock_balances { get; set; } = new List<stock_balance>();

    public virtual ICollection<stock_transaction_line> stock_transaction_lines { get; set; } = new List<stock_transaction_line>();
}
