using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class team
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public Guid? leader_user_id { get; set; }

    public Guid? home_admin_area_id { get; set; }

    public string status_code { get; set; } = null!;

    public int max_parallel_missions { get; set; }

    public Point? current_location { get; set; }

    public string? notes { get; set; }

    public DateTime created_at { get; set; }

    public virtual admin_area? home_admin_area { get; set; }

    public virtual app_user? leader_user { get; set; }

    public virtual ICollection<mission_team> mission_teams { get; set; } = new List<mission_team>();

    public virtual ICollection<mission> missions { get; set; } = new List<mission>();

    public virtual ICollection<team_member> team_members { get; set; } = new List<team_member>();

    public virtual ICollection<vehicle> vehicles { get; set; } = new List<vehicle>();
}
