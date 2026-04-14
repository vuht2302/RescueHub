using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class chi_tiet_yeu_cau_cuu_tro
{
    public Guid id { get; set; }

    public Guid yeu_cau_cuu_tro_id { get; set; }

    public Guid? mat_hang_id { get; set; }

    public string? support_type_code { get; set; }

    public decimal requested_qty { get; set; }

    public decimal approved_qty { get; set; }

    public decimal fulfilled_qty { get; set; }

    public Guid? don_vi_tinh_id { get; set; }

    public virtual don_vi_tinh? don_vi_tinh { get; set; }

    public virtual mat_hang? mat_hang { get; set; }

    public virtual yeu_cau_cuu_tro yeu_cau_cuu_tro { get; set; } = null!;
}
