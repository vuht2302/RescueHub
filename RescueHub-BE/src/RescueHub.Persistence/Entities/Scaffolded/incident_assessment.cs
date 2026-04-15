using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class incident_assessment
{
    public Guid id { get; set; }

    public Guid incident_id { get; set; }

    public Guid? assessed_by_user_id { get; set; }

    public string priority_code { get; set; } = null!;

    public string severity_code { get; set; } = null!;

    public bool requires_medical_support { get; set; }

    public bool requires_evacuation { get; set; }

    public string? notes { get; set; }

    public DateTime created_at { get; set; }

    public virtual app_user? assessed_by_user { get; set; }

    public virtual incident incident { get; set; } = null!;
}
