using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class yeu_cau_nang_luc_phuong_tien_su_co
{
    public Guid id { get; set; }

    public Guid su_co_id { get; set; }

    public Guid nang_luc_phuong_tien_id { get; set; }

    public int required_count { get; set; }

    public bool is_mandatory { get; set; }

    public DateTime created_at { get; set; }

    public virtual nang_luc_phuong_tien nang_luc_phuong_tien { get; set; } = null!;

    public virtual su_co su_co { get; set; } = null!;
}
