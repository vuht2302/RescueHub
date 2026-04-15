using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class relief_point
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public Guid campaign_id { get; set; }

    public Guid? admin_area_id { get; set; }

    public string address_text { get; set; } = null!;

    public Point geom { get; set; } = null!;

    public Guid? manager_user_id { get; set; }

    public string status_code { get; set; } = null!;

    public DateTime? opens_at { get; set; }

    public DateTime? closes_at { get; set; }

    public virtual admin_area? admin_area { get; set; }

    public virtual relief_campaign campaign { get; set; } = null!;

    public virtual ICollection<distribution> distributions { get; set; } = new List<distribution>();

    public virtual app_user? manager_user { get; set; }

    public virtual ICollection<relief_issue> relief_issues { get; set; } = new List<relief_issue>();
}
