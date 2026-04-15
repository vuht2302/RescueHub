using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class relief_issue
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public Guid? campaign_id { get; set; }

    public Guid relief_point_id { get; set; }

    public Guid from_warehouse_id { get; set; }

    public string status_code { get; set; } = null!;

    public string? note { get; set; }

    public Guid? created_by_user_id { get; set; }

    public DateTime created_at { get; set; }

    public virtual relief_campaign? campaign { get; set; }

    public virtual app_user? created_by_user { get; set; }

    public virtual warehouse from_warehouse { get; set; } = null!;

    public virtual ICollection<relief_issue_line> relief_issue_lines { get; set; } = new List<relief_issue_line>();

    public virtual relief_point relief_point { get; set; } = null!;
}
