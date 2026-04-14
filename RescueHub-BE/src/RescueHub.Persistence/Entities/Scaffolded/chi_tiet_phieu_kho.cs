using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class chi_tiet_phieu_kho
{
    public Guid id { get; set; }

    public Guid phieu_kho_id { get; set; }

    public Guid mat_hang_id { get; set; }

    public Guid? lo_hang_id { get; set; }

    public Guid? from_vi_tri_kho_id { get; set; }

    public Guid? to_vi_tri_kho_id { get; set; }

    public decimal qty { get; set; }

    public Guid? don_vi_tinh_id { get; set; }

    public DateOnly? exp_date_snapshot { get; set; }

    public string? donor_snapshot { get; set; }

    public string? line_note { get; set; }

    public DateTime created_at { get; set; }

    public virtual ICollection<chi_tiet_cap_phat_cuu_tro> chi_tiet_cap_phat_cuu_tros { get; set; } = new List<chi_tiet_cap_phat_cuu_tro>();

    public virtual don_vi_tinh? don_vi_tinh { get; set; }

    public virtual vi_tri_kho? from_vi_tri_kho { get; set; }

    public virtual lo_hang? lo_hang { get; set; }

    public virtual mat_hang mat_hang { get; set; } = null!;

    public virtual phieu_kho phieu_kho { get; set; } = null!;

    public virtual vi_tri_kho? to_vi_tri_kho { get; set; }
}
