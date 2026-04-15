using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class stock_alert
{
    public Guid id { get; set; }

    public Guid? warehouse_id { get; set; }

    public Guid? item_id { get; set; }

    public Guid? item_lot_id { get; set; }

    public string alert_type_code { get; set; } = null!;

    public string severity_code { get; set; } = null!;

    public string message { get; set; } = null!;

    public DateTime created_at { get; set; }

    public bool is_resolved { get; set; }

    public virtual item? item { get; set; }

    public virtual item_lot? item_lot { get; set; }

    public virtual warehouse? warehouse { get; set; }
}
