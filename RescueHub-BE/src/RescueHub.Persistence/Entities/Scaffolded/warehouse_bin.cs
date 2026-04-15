using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class warehouse_bin
{
    public Guid id { get; set; }

    public Guid warehouse_zone_id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public virtual ICollection<stock_balance> stock_balances { get; set; } = new List<stock_balance>();

    public virtual ICollection<stock_transaction_line> stock_transaction_linefrom_bins { get; set; } = new List<stock_transaction_line>();

    public virtual ICollection<stock_transaction_line> stock_transaction_lineto_bins { get; set; } = new List<stock_transaction_line>();

    public virtual warehouse_zone warehouse_zone { get; set; } = null!;
}
