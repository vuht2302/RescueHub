using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class distribution_line
{
    public Guid id { get; set; }

    public Guid distribution_id { get; set; }

    public Guid item_id { get; set; }

    public Guid item_lot_id { get; set; }

    public decimal qty { get; set; }

    public string unit_code { get; set; } = null!;

    public virtual distribution distribution { get; set; } = null!;

    public virtual item item { get; set; } = null!;

    public virtual item_lot item_lot { get; set; } = null!;
}
