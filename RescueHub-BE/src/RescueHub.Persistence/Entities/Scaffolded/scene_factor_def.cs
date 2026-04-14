using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class scene_factor_def
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string value_type { get; set; } = null!;

    public string? unit_group_code { get; set; }

    public string? description { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<chi_tiet_hien_truong> chi_tiet_hien_truongs { get; set; } = new List<chi_tiet_hien_truong>();

    public virtual ICollection<incident_type_scene_factor> incident_type_scene_factors { get; set; } = new List<incident_type_scene_factor>();
}
