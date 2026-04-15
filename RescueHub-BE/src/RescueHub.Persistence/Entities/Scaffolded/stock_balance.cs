using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class stock_balance
{
    public Guid id { get; set; }

    public Guid warehouse_id { get; set; }

    public Guid warehouse_bin_id { get; set; }

    public Guid item_id { get; set; }

    public Guid item_lot_id { get; set; }

    public decimal qty_on_hand { get; set; }

    public decimal qty_reserved { get; set; }

    public virtual item item { get; set; } = null!;

    public virtual item_lot item_lot { get; set; } = null!;

    public virtual warehouse warehouse { get; set; } = null!;

    public virtual warehouse_bin warehouse_bin { get; set; } = null!;
}
