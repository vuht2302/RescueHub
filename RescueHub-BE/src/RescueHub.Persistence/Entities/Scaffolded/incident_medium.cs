using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class incident_medium
{
    public Guid id { get; set; }

    public Guid incident_id { get; set; }

    public string file_public_id { get; set; } = null!;

    public string file_url { get; set; } = null!;

    public string? thumbnail_url { get; set; }

    public string? ai_optimized_url { get; set; }

    public string media_type_code { get; set; } = null!;

    public int? width { get; set; }

    public int? height { get; set; }

    public long? bytes { get; set; }

    public DateTime? captured_at { get; set; }

    public DateTime uploaded_at { get; set; }

    public virtual incident incident { get; set; } = null!;
}
