using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class khu_kho
{
    public Guid id { get; set; }

    public Guid kho_id { get; set; }

    public string zone_code { get; set; } = null!;

    public string zone_name { get; set; } = null!;

    public string? zone_type_code { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual kho kho { get; set; } = null!;

    public virtual ICollection<ton_kho> ton_khos { get; set; } = new List<ton_kho>();

    public virtual ICollection<vi_tri_kho> vi_tri_khos { get; set; } = new List<vi_tri_kho>();
}
