using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class incident_type_scene_factor
{
    public Guid id { get; set; }

    public Guid loai_su_co_id { get; set; }

    public Guid scene_factor_def_id { get; set; }

    public bool is_required { get; set; }

    public int sort_order { get; set; }

    public DateTime created_at { get; set; }

    public virtual loai_su_co loai_su_co { get; set; } = null!;

    public virtual scene_factor_def scene_factor_def { get; set; } = null!;
}
