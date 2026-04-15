using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class relief_issue_line
{
    public Guid id { get; set; }

    public Guid relief_issue_id { get; set; }

    public Guid item_id { get; set; }

    public Guid item_lot_id { get; set; }

    public decimal issue_qty { get; set; }

    public string unit_code { get; set; } = null!;

    public virtual item item { get; set; } = null!;

    public virtual item_lot item_lot { get; set; } = null!;

    public virtual relief_issue relief_issue { get; set; } = null!;
}
