using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class loai_su_co
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? category_code { get; set; }

    public string? description { get; set; }

    public string? icon { get; set; }

    public string? color_code { get; set; }

    public bool supports_sos { get; set; }

    public bool is_active { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<incident_type_scene_factor> incident_type_scene_factors { get; set; } = new List<incident_type_scene_factor>();

    public virtual ICollection<su_co> su_cos { get; set; } = new List<su_co>();
}
