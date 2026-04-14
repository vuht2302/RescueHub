using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class phan_cong_phuong_tien
{
    public Guid id { get; set; }

    public Guid nhiem_vu_cuu_ho_id { get; set; }

    public Guid phuong_tien_id { get; set; }

    public string? assignment_role_code { get; set; }

    public DateTime assigned_at { get; set; }

    public DateTime? released_at { get; set; }

    public virtual nhiem_vu_cuu_ho nhiem_vu_cuu_ho { get; set; } = null!;

    public virtual phuong_tien phuong_tien { get; set; } = null!;
}
