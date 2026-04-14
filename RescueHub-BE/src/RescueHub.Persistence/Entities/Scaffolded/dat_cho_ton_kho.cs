using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class dat_cho_ton_kho
{
    public Guid id { get; set; }

    public Guid kho_id { get; set; }

    public Guid? vi_tri_kho_id { get; set; }

    public Guid mat_hang_id { get; set; }

    public Guid? lo_hang_id { get; set; }

    public string reference_type { get; set; } = null!;

    public Guid reference_id { get; set; }

    public decimal reserved_qty { get; set; }

    public string status_code { get; set; } = null!;

    public DateTime reserved_at { get; set; }

    public DateTime? released_at { get; set; }

    public virtual kho kho { get; set; } = null!;

    public virtual lo_hang? lo_hang { get; set; }

    public virtual mat_hang mat_hang { get; set; } = null!;

    public virtual vi_tri_kho? vi_tri_kho { get; set; }
}
