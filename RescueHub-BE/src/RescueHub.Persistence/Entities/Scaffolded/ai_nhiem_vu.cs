using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ai_nhiem_vu
{
    public Guid id { get; set; }

    public string job_type_code { get; set; } = null!;

    public string? provider_name { get; set; }

    public string? model_name { get; set; }

    public string entity_type { get; set; } = null!;

    public Guid entity_id { get; set; }

    public string? input_hash { get; set; }

    public string status_code { get; set; } = null!;

    public Guid? requested_by { get; set; }

    public DateTime requested_at { get; set; }

    public DateTime? completed_at { get; set; }

    public string? error_message { get; set; }

    public virtual ICollection<ai_goi_y> ai_goi_ies { get; set; } = new List<ai_goi_y>();

    public virtual nguoi_dung? requested_byNavigation { get; set; }
}
