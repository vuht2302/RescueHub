using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mission
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public Guid incident_id { get; set; }

    public string status_code { get; set; } = null!;

    public string priority_code { get; set; } = null!;

    public string objective { get; set; } = null!;

    public Guid? coordinator_user_id { get; set; }

    public Guid? primary_team_id { get; set; }

    public int? eta_minutes { get; set; }

    public DateTime? started_at { get; set; }

    public DateTime? completed_at { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual app_user? coordinator_user { get; set; }

    public virtual incident incident { get; set; } = null!;

    public virtual ICollection<mission_abort_request> mission_abort_requests { get; set; } = new List<mission_abort_request>();

    public virtual ICollection<mission_field_report> mission_field_reports { get; set; } = new List<mission_field_report>();

    public virtual ICollection<mission_member> mission_members { get; set; } = new List<mission_member>();

    public virtual ICollection<mission_status_history> mission_status_histories { get; set; } = new List<mission_status_history>();

    public virtual ICollection<mission_support_request> mission_support_requests { get; set; } = new List<mission_support_request>();

    public virtual ICollection<mission_team> mission_teams { get; set; } = new List<mission_team>();

    public virtual ICollection<mission_vehicle> mission_vehicles { get; set; } = new List<mission_vehicle>();

    public virtual team? primary_team { get; set; }
}
