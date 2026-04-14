using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class phieu_kho
{
    public Guid id { get; set; }

    public string transaction_code { get; set; } = null!;

    public string transaction_type_code { get; set; } = null!;

    public Guid? workflow_state_id { get; set; }

    public Guid? source_kho_id { get; set; }

    public Guid? dest_kho_id { get; set; }

    public string? reference_type { get; set; }

    public Guid? reference_id { get; set; }

    public DateTime happened_at { get; set; }

    public Guid? approved_by { get; set; }

    public DateTime? approved_at { get; set; }

    public string? note { get; set; }

    public Guid? created_by { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual nguoi_dung? approved_byNavigation { get; set; }

    public virtual ICollection<chi_tiet_phieu_kho> chi_tiet_phieu_khos { get; set; } = new List<chi_tiet_phieu_kho>();

    public virtual nguoi_dung? created_byNavigation { get; set; }

    public virtual kho? dest_kho { get; set; }

    public virtual kho? source_kho { get; set; }

    public virtual workflow_state? workflow_state { get; set; }
}
