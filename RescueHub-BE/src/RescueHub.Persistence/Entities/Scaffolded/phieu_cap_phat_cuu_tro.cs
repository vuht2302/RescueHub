using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class phieu_cap_phat_cuu_tro
{
    public Guid id { get; set; }

    public string relief_issue_code { get; set; } = null!;

    public Guid? chien_dich_cuu_tro_id { get; set; }

    public Guid? diem_cuu_tro_id { get; set; }

    public Guid? from_kho_id { get; set; }

    public Guid? workflow_state_id { get; set; }

    public Guid? issued_by { get; set; }

    public DateTime? issued_at { get; set; }

    public Guid? received_by { get; set; }

    public DateTime? received_at { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<chi_tiet_cap_phat_cuu_tro> chi_tiet_cap_phat_cuu_tros { get; set; } = new List<chi_tiet_cap_phat_cuu_tro>();

    public virtual chien_dich_cuu_tro? chien_dich_cuu_tro { get; set; }

    public virtual diem_cuu_tro? diem_cuu_tro { get; set; }

    public virtual kho? from_kho { get; set; }

    public virtual nguoi_dung? issued_byNavigation { get; set; }

    public virtual nguoi_dung? received_byNavigation { get; set; }

    public virtual workflow_state? workflow_state { get; set; }
}
