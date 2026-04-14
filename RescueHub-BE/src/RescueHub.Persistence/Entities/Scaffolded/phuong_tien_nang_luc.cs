using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class phuong_tien_nang_luc
{
    public Guid id { get; set; }

    public Guid phuong_tien_id { get; set; }

    public Guid nang_luc_phuong_tien_id { get; set; }

    public DateTime created_at { get; set; }

    public virtual nang_luc_phuong_tien nang_luc_phuong_tien { get; set; } = null!;

    public virtual phuong_tien phuong_tien { get; set; } = null!;
}
