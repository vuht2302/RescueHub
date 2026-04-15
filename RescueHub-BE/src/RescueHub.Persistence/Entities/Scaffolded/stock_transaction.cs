using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class stock_transaction
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string transaction_type_code { get; set; } = null!;

    public Guid warehouse_id { get; set; }

    public string? reference_type_code { get; set; }

    public Guid? reference_id { get; set; }

    public DateTime happened_at { get; set; }

    public string? note { get; set; }

    public Guid? created_by_user_id { get; set; }

    public DateTime created_at { get; set; }

    public virtual app_user? created_by_user { get; set; }

    public virtual ICollection<stock_transaction_line> stock_transaction_lines { get; set; } = new List<stock_transaction_line>();

    public virtual warehouse warehouse { get; set; } = null!;
}
