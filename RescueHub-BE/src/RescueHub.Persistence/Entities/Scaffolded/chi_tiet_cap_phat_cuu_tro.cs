using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class chi_tiet_cap_phat_cuu_tro
{
    public Guid id { get; set; }

    public Guid phieu_cap_phat_cuu_tro_id { get; set; }

    public Guid mat_hang_id { get; set; }

    public Guid? lo_hang_id { get; set; }

    public decimal issue_qty { get; set; }

    public decimal received_qty { get; set; }

    public Guid? don_vi_tinh_id { get; set; }

    public Guid? source_phieu_kho_line_id { get; set; }

    public virtual ICollection<chi_tiet_phat_cuu_tro> chi_tiet_phat_cuu_tros { get; set; } = new List<chi_tiet_phat_cuu_tro>();

    public virtual don_vi_tinh? don_vi_tinh { get; set; }

    public virtual lo_hang? lo_hang { get; set; }

    public virtual mat_hang mat_hang { get; set; } = null!;

    public virtual phieu_cap_phat_cuu_tro phieu_cap_phat_cuu_tro { get; set; } = null!;

    public virtual chi_tiet_phieu_kho? source_phieu_kho_line { get; set; }
}
