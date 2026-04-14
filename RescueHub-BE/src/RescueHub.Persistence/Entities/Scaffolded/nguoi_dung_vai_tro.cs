using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class nguoi_dung_vai_tro
{
    public Guid id { get; set; }

    public Guid nguoi_dung_id { get; set; }

    public Guid vai_tro_id { get; set; }

    public Guid? don_vi_id { get; set; }

    public DateTime? effective_from { get; set; }

    public DateTime? effective_to { get; set; }

    public DateTime created_at { get; set; }

    public virtual don_vi? don_vi { get; set; }

    public virtual nguoi_dung nguoi_dung { get; set; } = null!;

    public virtual vai_tro vai_tro { get; set; } = null!;
}
