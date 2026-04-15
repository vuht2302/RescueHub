using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class relief_request_item
{
    public Guid id { get; set; }

    public Guid relief_request_id { get; set; }

    public Guid item_id { get; set; }

    public decimal requested_qty { get; set; }

    public decimal? approved_qty { get; set; }

    public string unit_code { get; set; } = null!;

    public virtual item item { get; set; } = null!;

    public virtual relief_request relief_request { get; set; } = null!;
}
