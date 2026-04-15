using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class relief_campaign
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string status_code { get; set; } = null!;

    public Guid? linked_incident_id { get; set; }

    public Guid? admin_area_id { get; set; }

    public DateTime start_at { get; set; }

    public DateTime? end_at { get; set; }

    public string? description { get; set; }

    public virtual admin_area? admin_area { get; set; }

    public virtual ICollection<distribution> distributions { get; set; } = new List<distribution>();

    public virtual incident? linked_incident { get; set; }

    public virtual ICollection<relief_issue> relief_issues { get; set; } = new List<relief_issue>();

    public virtual ICollection<relief_point> relief_points { get; set; } = new List<relief_point>();

    public virtual ICollection<relief_request> relief_requests { get; set; } = new List<relief_request>();
}
