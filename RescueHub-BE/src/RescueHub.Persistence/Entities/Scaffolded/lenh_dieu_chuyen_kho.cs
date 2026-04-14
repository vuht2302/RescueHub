using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class lenh_dieu_chuyen_kho
{
    public Guid id { get; set; }

    public string transfer_code { get; set; } = null!;

    public Guid from_kho_id { get; set; }

    public Guid to_kho_id { get; set; }

    public Guid? workflow_state_id { get; set; }

    public Guid? ly_do_id { get; set; }

    public Guid? requested_by { get; set; }

    public Guid? approved_by { get; set; }

    public DateTime? shipped_at { get; set; }

    public DateTime? received_at { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual nguoi_dung? approved_byNavigation { get; set; }

    public virtual ICollection<chi_tiet_dieu_chuyen_kho> chi_tiet_dieu_chuyen_khos { get; set; } = new List<chi_tiet_dieu_chuyen_kho>();

    public virtual kho from_kho { get; set; } = null!;

    public virtual ly_do? ly_do { get; set; }

    public virtual nguoi_dung? requested_byNavigation { get; set; }

    public virtual kho to_kho { get; set; } = null!;

    public virtual workflow_state? workflow_state { get; set; }
}
