using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class distribution
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public Guid? campaign_id { get; set; }

    public Guid? relief_point_id { get; set; }

    public Guid household_id { get; set; }

    public Guid? linked_incident_id { get; set; }

    public string ack_method_code { get; set; } = null!;

    public string status_code { get; set; } = null!;

    public string? note { get; set; }

    public Guid? created_by_user_id { get; set; }

    public DateTime created_at { get; set; }

    public virtual relief_campaign? campaign { get; set; }

    public virtual app_user? created_by_user { get; set; }

    public virtual distribution_ack? distribution_ack { get; set; }

    public virtual ICollection<distribution_line> distribution_lines { get; set; } = new List<distribution_line>();

    public virtual household household { get; set; } = null!;

    public virtual incident? linked_incident { get; set; }

    public virtual relief_point? relief_point { get; set; }
}
