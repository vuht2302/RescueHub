using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class canh_bao_kho
{
    public Guid id { get; set; }

    public string alert_type_code { get; set; } = null!;

    public Guid? kho_id { get; set; }

    public Guid? mat_hang_id { get; set; }

    public Guid? lo_hang_id { get; set; }

    public string? severity_code { get; set; }

    public DateTime detected_at { get; set; }

    public DateTime? resolved_at { get; set; }

    public string status_code { get; set; } = null!;

    public string? summary { get; set; }

    public virtual kho? kho { get; set; }

    public virtual lo_hang? lo_hang { get; set; }

    public virtual mat_hang? mat_hang { get; set; }
}
