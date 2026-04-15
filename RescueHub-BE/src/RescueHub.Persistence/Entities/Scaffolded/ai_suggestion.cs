using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ai_suggestion
{
    public Guid id { get; set; }

    public Guid ai_job_id { get; set; }

    public string suggestion_type_code { get; set; } = null!;

    public string target_entity_type_code { get; set; } = null!;

    public Guid target_entity_id { get; set; }

    public string payload_json { get; set; } = null!;

    public decimal? confidence_score { get; set; }

    public string approval_status_code { get; set; } = null!;

    public Guid? approved_by_user_id { get; set; }

    public DateTime? approved_at { get; set; }

    public DateTime created_at { get; set; }

    public virtual ai_job ai_job { get; set; } = null!;

    public virtual app_user? approved_by_user { get; set; }
}
