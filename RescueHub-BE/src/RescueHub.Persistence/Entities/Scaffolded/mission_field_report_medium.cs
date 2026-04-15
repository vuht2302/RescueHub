using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mission_field_report_medium
{
    public Guid id { get; set; }

    public Guid mission_field_report_id { get; set; }

    public string file_public_id { get; set; } = null!;

    public string file_url { get; set; } = null!;

    public string? thumbnail_url { get; set; }

    public string? ai_optimized_url { get; set; }

    public string media_type_code { get; set; } = null!;

    public DateTime uploaded_at { get; set; }

    public virtual mission_field_report mission_field_report { get; set; } = null!;
}
