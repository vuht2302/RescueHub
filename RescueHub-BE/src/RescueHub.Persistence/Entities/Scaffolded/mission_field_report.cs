using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mission_field_report
{
    public Guid id { get; set; }

    public Guid mission_id { get; set; }

    public Guid? reported_by_user_id { get; set; }

    public string report_type_code { get; set; } = null!;

    public string summary { get; set; } = null!;

    public int rescued_count { get; set; }

    public int unreachable_count { get; set; }

    public int casualty_count { get; set; }

    public string? next_action_note { get; set; }

    public decimal? flood_depth_m { get; set; }

    public string? access_condition_code { get; set; }

    public DateTime created_at { get; set; }

    public virtual mission mission { get; set; } = null!;

    public virtual ICollection<mission_field_report_medium> mission_field_report_media { get; set; } = new List<mission_field_report_medium>();

    public virtual app_user? reported_by_user { get; set; }
}
