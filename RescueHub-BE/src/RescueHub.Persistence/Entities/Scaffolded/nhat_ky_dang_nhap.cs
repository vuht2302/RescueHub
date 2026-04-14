using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class nhat_ky_dang_nhap
{
    public Guid id { get; set; }

    public Guid? nguoi_dung_id { get; set; }

    public DateTime login_at { get; set; }

    public DateTime? logout_at { get; set; }

    public string? ip_address { get; set; }

    public string? device_info { get; set; }

    public string result_status_code { get; set; } = null!;

    public virtual nguoi_dung? nguoi_dung { get; set; }
}
