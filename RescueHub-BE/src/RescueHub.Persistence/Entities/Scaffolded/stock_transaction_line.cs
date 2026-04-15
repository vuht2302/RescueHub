using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class stock_transaction_line
{
    public Guid id { get; set; }

    public Guid stock_transaction_id { get; set; }

    public Guid item_id { get; set; }

    public Guid item_lot_id { get; set; }

    public Guid? from_bin_id { get; set; }

    public Guid? to_bin_id { get; set; }

    public decimal qty { get; set; }

    public string unit_code { get; set; } = null!;

    public virtual warehouse_bin? from_bin { get; set; }

    public virtual item item { get; set; } = null!;

    public virtual item_lot item_lot { get; set; } = null!;

    public virtual stock_transaction stock_transaction { get; set; } = null!;

    public virtual warehouse_bin? to_bin { get; set; }
}
