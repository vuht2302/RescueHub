using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class chi_tiet_dieu_chuyen_kho
{
    public Guid id { get; set; }

    public Guid lenh_dieu_chuyen_kho_id { get; set; }

    public Guid mat_hang_id { get; set; }

    public Guid? lo_hang_id { get; set; }

    public decimal requested_qty { get; set; }

    public decimal allocated_qty { get; set; }

    public decimal shipped_qty { get; set; }

    public decimal received_qty { get; set; }

    public Guid? don_vi_tinh_id { get; set; }

    public virtual don_vi_tinh? don_vi_tinh { get; set; }

    public virtual lenh_dieu_chuyen_kho lenh_dieu_chuyen_kho { get; set; } = null!;

    public virtual lo_hang? lo_hang { get; set; }

    public virtual mat_hang mat_hang { get; set; } = null!;
}
