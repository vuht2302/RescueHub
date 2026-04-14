using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class lich_su_trang_thai_nhiem_vu
{
    public Guid id { get; set; }

    public Guid nhiem_vu_cuu_ho_id { get; set; }

    public Guid? from_state_id { get; set; }

    public Guid? to_state_id { get; set; }

    public string? action_code { get; set; }

    public Guid? changed_by { get; set; }

    public DateTime changed_at { get; set; }

    public Guid? ly_do_id { get; set; }

    public string? note { get; set; }

    public virtual nguoi_dung? changed_byNavigation { get; set; }

    public virtual workflow_state? from_state { get; set; }

    public virtual ly_do? ly_do { get; set; }

    public virtual nhiem_vu_cuu_ho nhiem_vu_cuu_ho { get; set; } = null!;

    public virtual workflow_state? to_state { get; set; }
}
