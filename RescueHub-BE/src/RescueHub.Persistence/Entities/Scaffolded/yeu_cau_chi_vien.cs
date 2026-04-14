using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class yeu_cau_chi_vien
{
    public Guid id { get; set; }

    public Guid nhiem_vu_cuu_ho_id { get; set; }

    public string support_type_code { get; set; } = null!;

    public Guid? requested_by { get; set; }

    public DateTime requested_at { get; set; }

    public string status_code { get; set; } = null!;

    public string? detail_note { get; set; }

    public virtual nhiem_vu_cuu_ho nhiem_vu_cuu_ho { get; set; } = null!;

    public virtual nguoi_dung? requested_byNavigation { get; set; }
}
