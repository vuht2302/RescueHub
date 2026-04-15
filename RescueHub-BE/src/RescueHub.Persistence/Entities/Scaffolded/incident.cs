using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class incident
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string incident_type_code { get; set; } = null!;

    public string incident_channel_code { get; set; } = null!;

    public string status_code { get; set; } = null!;

    public string priority_code { get; set; } = null!;

    public string reporter_name { get; set; } = null!;

    public string reporter_phone { get; set; } = null!;

    public bool contact_verified { get; set; }

    public bool is_sos { get; set; }

    public string description { get; set; } = null!;

    public int estimated_victim_count { get; set; }

    public int estimated_injured_count { get; set; }

    public int estimated_vulnerable_count { get; set; }

    public bool need_relief { get; set; }

    public string? ai_summary { get; set; }

    public Guid? created_by_user_id { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual app_user? created_by_user { get; set; }

    public virtual ICollection<distribution> distributions { get; set; } = new List<distribution>();

    public virtual ICollection<incident_assessment> incident_assessments { get; set; } = new List<incident_assessment>();

    public virtual incident_location? incident_location { get; set; }

    public virtual ICollection<incident_medium> incident_media { get; set; } = new List<incident_medium>();

    public virtual ICollection<incident_requirement_skill> incident_requirement_skills { get; set; } = new List<incident_requirement_skill>();

    public virtual ICollection<incident_requirement_vehicle_capability> incident_requirement_vehicle_capabilities { get; set; } = new List<incident_requirement_vehicle_capability>();

    public virtual ICollection<incident_status_history> incident_status_histories { get; set; } = new List<incident_status_history>();

    public virtual ICollection<mission> missions { get; set; } = new List<mission>();

    public virtual ICollection<relief_campaign> relief_campaigns { get; set; } = new List<relief_campaign>();

    public virtual ICollection<relief_request> relief_requests { get; set; } = new List<relief_request>();

    public virtual rescue_ack? rescue_ack { get; set; }
}
