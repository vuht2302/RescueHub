using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class team_member
{
    public Guid id { get; set; }

    public Guid team_id { get; set; }

    public Guid? user_id { get; set; }

    public string full_name { get; set; } = null!;

    public string? phone { get; set; }

    public string status_code { get; set; } = null!;

    public bool is_team_leader { get; set; }

    public Point? last_known_location { get; set; }

    public string? notes { get; set; }

    public DateTime created_at { get; set; }

    public virtual ICollection<mission_member> mission_members { get; set; } = new List<mission_member>();

    public virtual team team { get; set; } = null!;

    public virtual ICollection<team_member_skill> team_member_skills { get; set; } = new List<team_member_skill>();

    public virtual app_user? user { get; set; }
}
