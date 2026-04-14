using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ton_kho
{
    public Guid id { get; set; }

    public Guid kho_id { get; set; }

    public Guid? khu_kho_id { get; set; }

    public Guid? vi_tri_kho_id { get; set; }

    public Guid mat_hang_id { get; set; }

    public Guid? lo_hang_id { get; set; }

    public decimal qty_on_hand { get; set; }

    public decimal qty_reserved { get; set; }

    public decimal qty_available { get; set; }

    public DateTime? last_counted_at { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual kho kho { get; set; } = null!;

    public virtual khu_kho? khu_kho { get; set; }

    public virtual lo_hang? lo_hang { get; set; }

    public virtual mat_hang mat_hang { get; set; } = null!;

    public virtual vi_tri_kho? vi_tri_kho { get; set; }
}
