using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class lich_su_trang_thai_phuong_tien
{
    public Guid id { get; set; }

    public Guid phuong_tien_id { get; set; }

    public string? from_status_code { get; set; }

    public string to_status_code { get; set; } = null!;

    public DateTime changed_at { get; set; }

    public Guid? changed_by { get; set; }

    public Guid? ly_do_id { get; set; }

    public string? note { get; set; }

    public virtual nguoi_dung? changed_byNavigation { get; set; }

    public virtual ly_do? ly_do { get; set; }

    public virtual phuong_tien phuong_tien { get; set; } = null!;
}
