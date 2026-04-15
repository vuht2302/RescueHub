using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ai_job
{
    public Guid id { get; set; }

    public string job_type_code { get; set; } = null!;

    public string target_entity_type_code { get; set; } = null!;

    public Guid target_entity_id { get; set; }

    public string status_code { get; set; } = null!;

    public Guid? requested_by_user_id { get; set; }

    public DateTime requested_at { get; set; }

    public DateTime? started_at { get; set; }

    public DateTime? completed_at { get; set; }

    public string? input_payload { get; set; }

    public string? output_payload { get; set; }

    public string? error_message { get; set; }

    public virtual ICollection<ai_suggestion> ai_suggestions { get; set; } = new List<ai_suggestion>();

    public virtual app_user? requested_by_user { get; set; }
}
