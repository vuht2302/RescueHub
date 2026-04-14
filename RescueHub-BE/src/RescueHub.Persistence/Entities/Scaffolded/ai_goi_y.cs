using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ai_goi_y
{
    public Guid id { get; set; }

    public Guid ai_nhiem_vu_id { get; set; }

    public string suggestion_type_code { get; set; } = null!;

    public string target_entity_type { get; set; } = null!;

    public Guid target_entity_id { get; set; }

    public decimal? confidence_score { get; set; }

    public string? payload_json { get; set; }

    public string approval_status_code { get; set; } = null!;

    public Guid? approved_by { get; set; }

    public DateTime? approved_at { get; set; }

    public DateTime created_at { get; set; }

    public virtual ai_nhiem_vu ai_nhiem_vu { get; set; } = null!;

    public virtual nguoi_dung? approved_byNavigation { get; set; }
}
