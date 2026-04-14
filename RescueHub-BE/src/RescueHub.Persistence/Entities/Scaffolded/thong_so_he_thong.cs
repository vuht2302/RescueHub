using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class thong_so_he_thong
{
    public Guid id { get; set; }

    public string param_group { get; set; } = null!;

    public string param_key { get; set; } = null!;

    public string? param_value { get; set; }

    public string value_type { get; set; } = null!;

    public string? description { get; set; }

    public Guid? updated_by { get; set; }

    public DateTime updated_at { get; set; }

    public virtual nguoi_dung? updated_byNavigation { get; set; }
}
